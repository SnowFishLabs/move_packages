/// This module provides the foundation for typesafe Coins.
module test::coin5 {
    use std::error;
    use std::features;
    use std::option::{Self, Option};
    use std::string::{Self, String};
    use aptos_std::table::{Self, Table};

    use aptos_framework::aggregator::Aggregator;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::system_addresses;
    use aptos_framework::optional_aggregator::{OptionalAggregator};

    use aptos_framework::fungible_asset::{Self, Metadata, MintRef, TransferRef, BurnRef};
    use aptos_framework::object::{Self, Object, object_address};
    use aptos_std::type_info::{Self, TypeInfo};

    //
    // Errors.
    //

    /// Address of account which is used to initialize a coin `CoinType` doesn't match the deployer of module
    const ECOIN_INFO_ADDRESS_MISMATCH: u64 = 1;

    /// `CoinType` is already initialized as a coin
    const ECOIN_INFO_ALREADY_PUBLISHED: u64 = 2;

    /// `CoinType` hasn't been initialized as a coin
    const ECOIN_INFO_NOT_PUBLISHED: u64 = 3;

    /// Deprecated. Account already has `CoinStore` registered for `CoinType`
    const ECOIN_STORE_ALREADY_PUBLISHED: u64 = 4;

    /// Account hasn't registered `CoinStore` for `CoinType`
    const ECOIN_STORE_NOT_PUBLISHED: u64 = 5;

    /// Not enough coins to complete transaction
    const EINSUFFICIENT_BALANCE: u64 = 6;

    /// Cannot destroy non-zero coins
    const EDESTRUCTION_OF_NONZERO_TOKEN: u64 = 7;

    /// CoinStore is frozen. Coins cannot be deposited or withdrawn
    const EFROZEN: u64 = 10;

    /// Cannot upgrade the total supply of coins to different implementation.
    const ECOIN_SUPPLY_UPGRADE_NOT_SUPPORTED: u64 = 11;

    /// Name of the coin is too long
    const ECOIN_NAME_TOO_LONG: u64 = 12;

    /// Symbol of the coin is too long
    const ECOIN_SYMBOL_TOO_LONG: u64 = 13;

    /// The value of aggregatable coin used for transaction fees redistribution does not fit in u64.
    const EAGGREGATABLE_COIN_VALUE_TOO_LARGE: u64 = 14;

    /// Error regarding paired coin type of the fungible asset metadata.
    const EPAIRED_COIN: u64 = 15;

    /// Error regarding paired fungible asset metadata of a coin type.
    const EPAIRED_FUNGIBLE_ASSET: u64 = 16;

    /// The coin type from the map does not match the calling function type argument.
    const ECOIN_TYPE_MISMATCH: u64 = 17;

    /// The feature of migration from coin to fungible asset is not enabled.
    const ECOIN_TO_FUNGIBLE_ASSET_FEATURE_NOT_ENABLED: u64 = 18;

    /// PairedFungibleAssetRefs resource does not exist.
    const EPAIRED_FUNGIBLE_ASSET_REFS_NOT_FOUND: u64 = 19;

    /// The MintRefReceipt does not match the MintRef to be returned.
    const EMINT_REF_RECEIPT_MISMATCH: u64 = 20;

    /// The MintRef does not exist.
    const EMINT_REF_NOT_FOUND: u64 = 21;

    /// The TransferRefReceipt does not match the TransferRef to be returned.
    const ETRANSFER_REF_RECEIPT_MISMATCH: u64 = 22;

    /// The TransferRef does not exist.
    const ETRANSFER_REF_NOT_FOUND: u64 = 23;

    /// The BurnRefReceipt does not match the BurnRef to be returned.
    const EBURN_REF_RECEIPT_MISMATCH: u64 = 24;

    /// The BurnRef does not exist.
    const EBURN_REF_NOT_FOUND: u64 = 25;

    /// The migration process from coin to fungible asset is not enabled yet.
    const EMIGRATION_FRAMEWORK_NOT_ENABLED: u64 = 26;

    /// The coin converison map is not created yet.
    const ECOIN_CONVERSION_MAP_NOT_FOUND: u64 = 27;

    /// APT pairing is not eanbled yet.
    const EAPT_PAIRING_IS_NOT_ENABLED: u64 = 28;

    /// The decimals of the coin is too large.
    const ECOIN_DECIMALS_TOO_LARGE: u64 = 29;

    //
    // Constants
    //

    const MAX_COIN_NAME_LENGTH: u64 = 32;
    const MAX_COIN_SYMBOL_LENGTH: u64 = 32;
    const MAX_DECIMALS: u8 = 32;

    /// Core data structures

    /// Main structure representing a coin/token in an account's custody.
    struct Coin<phantom CoinType> has store {
        /// Amount of coin this address has.
        value: u64,
    }

    #[deprecated]
    /// DEPRECATED
    struct AggregatableCoin<phantom CoinType> has store {
        /// Amount of aggregatable coin this address has.
        value: Aggregator,
    }

    /// Maximum possible aggregatable coin value.
    const MAX_U64: u128 = 18446744073709551615;

    /// A holder of a specific coin types and associated event handles.
    /// These are kept in a single resource to ensure locality of data.
    struct CoinStore<phantom CoinType> has key {
        coin: Coin<CoinType>,
        frozen: bool,
        deposit_events: EventHandle<DepositEvent>,
        withdraw_events: EventHandle<WithdrawEvent>,
    }

    #[deprecated]
    /// Configuration that controls the behavior of total coin supply. If the field
    /// is set, coin creators are allowed to upgrade to parallelizable implementations.
    struct SupplyConfig has key {
        allow_upgrades: bool,
    }

    /// Information about a specific coin type. Stored on the creator of the coin's account.
    struct CoinInfo<phantom CoinType> has key {
        name: String,
        /// Symbol of the coin, usually a shorter version of the name.
        /// For example, Singapore Dollar is SGD.
        symbol: String,
        /// Number of decimals used to get its user representation.
        /// For example, if `decimals` equals `2`, a balance of `505` coins should
        /// be displayed to a user as `5.05` (`505 / 10 ** 2`).
        decimals: u8,
        /// Amount of this coin type in existence.
        supply: Option<OptionalAggregator>,
    }


    #[event]
    /// Module event emitted when some amount of a coin is deposited into an account.
    struct CoinDeposit has drop, store {
        coin_type: String,
        account: address,
        amount: u64,
    }

    #[event]
    /// Module event emitted when some amount of a coin is withdrawn from an account.
    struct CoinWithdraw has drop, store {
        coin_type: String,
        account: address,
        amount: u64,
    }

    // DEPRECATED, NEVER USED
    #[deprecated]
    #[event]
    struct Deposit<phantom CoinType> has drop, store {
        account: address,
        amount: u64,
    }

    // DEPRECATED, NEVER USED
    #[deprecated]
    #[event]
    struct Withdraw<phantom CoinType> has drop, store {
        account: address,
        amount: u64,
    }

    /// Event emitted when some amount of a coin is deposited into an account.
    struct DepositEvent has drop, store {
        amount: u64,
    }

    /// Event emitted when some amount of a coin is withdrawn from an account.
    struct WithdrawEvent has drop, store {
        amount: u64,
    }


    #[deprecated]
    #[event]
    /// Module event emitted when the event handles related to coin store is deleted.
    ///
    /// Deprecated: replaced with CoinStoreDeletion
    struct CoinEventHandleDeletion has drop, store {
        event_handle_creation_address: address,
        deleted_deposit_event_handle_creation_number: u64,
        deleted_withdraw_event_handle_creation_number: u64,
    }

    #[event]
    /// Module event emitted when the event handles related to coin store is deleted.
    struct CoinStoreDeletion has drop, store {
        coin_type: String,
        event_handle_creation_address: address,
        deleted_deposit_event_handle_creation_number: u64,
        deleted_withdraw_event_handle_creation_number: u64,
    }

    #[event]
    /// Module event emitted when a new pair of coin and fungible asset is created.
    struct PairCreation has drop, store {
        coin_type: TypeInfo,
        fungible_asset_metadata_address: address,
    }

    /// Capability required to mint coins.
    struct MintCapability<phantom CoinType> has copy, store {}

    /// Capability required to freeze a coin store.
    struct FreezeCapability<phantom CoinType> has copy, store {}

    /// Capability required to burn coins.
    struct BurnCapability<phantom CoinType> has copy, store {}

    /// The mapping between coin and fungible asset.
    struct CoinConversionMap has key {
        coin_to_fungible_asset_map: Table<TypeInfo, Object<Metadata>>,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    /// The paired coin type info stored in fungible asset metadata object.
    struct PairedCoinType has key {
        type: TypeInfo,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    /// The refs of the paired fungible asset.
    struct PairedFungibleAssetRefs has key {
        mint_ref_opt: Option<MintRef>,
        transfer_ref_opt: Option<TransferRef>,
        burn_ref_opt: Option<BurnRef>,
    }

    /// The hot potato receipt for flash borrowing MintRef.
    struct MintRefReceipt {
        metadata: Object<Metadata>,
    }

    /// The hot potato receipt for flash borrowing TransferRef.
    struct TransferRefReceipt {
        metadata: Object<Metadata>,
    }

    /// The hot potato receipt for flash borrowing BurnRef.
    struct BurnRefReceipt {
        metadata: Object<Metadata>,
    }

    #[view]
    /// Get the paired fungible asset metadata object of a coin type. If not exist, return option::none().
    public fun paired_metadata<CoinType>(): Option<Object<Metadata>> acquires CoinConversionMap {
        if (exists<CoinConversionMap>(@aptos_framework) && features::coin_to_fungible_asset_migration_feature_enabled(
        )) {
            let map = &borrow_global<CoinConversionMap>(@aptos_framework).coin_to_fungible_asset_map;
            let type = type_info::type_of<CoinType>();
            if (table::contains(map, type)) {
                return option::some(*table::borrow(map, type))
            }
        };
        option::none()
    }

    public entry fun create_coin_conversion_map(aptos_framework: &signer) {
        system_addresses::assert_aptos_framework(aptos_framework);
        if (!exists<CoinConversionMap>(@aptos_framework)) {
            move_to(aptos_framework, CoinConversionMap {
                coin_to_fungible_asset_map: table::new(),
            })
        };
    }

    /// Create APT pairing by passing `AptosCoin`.
    public entry fun create_pairing<CoinType>(
        aptos_framework: &signer
    ) acquires CoinConversionMap {
        system_addresses::assert_aptos_framework(aptos_framework);
        create_and_return_paired_metadata_if_not_exist<CoinType>(true);
    }

    inline fun is_apt<CoinType>(): bool {
        type_info::type_name<CoinType>() == string::utf8(b"0x1::aptos_coin::AptosCoin")
    }

    inline fun create_and_return_paired_metadata_if_not_exist<CoinType>(allow_apt_creation: bool): Object<Metadata> {
        assert!(
            features::coin_to_fungible_asset_migration_feature_enabled(),
            error::invalid_state(EMIGRATION_FRAMEWORK_NOT_ENABLED)
        );
        assert!(exists<CoinConversionMap>(@aptos_framework), error::not_found(ECOIN_CONVERSION_MAP_NOT_FOUND));
        let map = borrow_global_mut<CoinConversionMap>(@aptos_framework);
        let type = type_info::type_of<CoinType>();
        if (!table::contains(&map.coin_to_fungible_asset_map, type)) {
            let is_apt = is_apt<CoinType>();
            assert!(!is_apt || allow_apt_creation, error::invalid_state(EAPT_PAIRING_IS_NOT_ENABLED));
            let metadata_object_cref =
                 object::create_object(@0x1);

            let metadata_object_signer = &object::generate_signer(&metadata_object_cref);
            let type = type_info::type_of<CoinType>();
            move_to(metadata_object_signer, PairedCoinType { type });
            let metadata_obj = object::object_from_constructor_ref(&metadata_object_cref);

            table::add(&mut map.coin_to_fungible_asset_map, type, metadata_obj);
            event::emit(PairCreation {
                coin_type: type,
                fungible_asset_metadata_address: object_address(&metadata_obj)
            });

            // Generates all three refs
            let mint_ref = fungible_asset::generate_mint_ref(&metadata_object_cref);
            let transfer_ref = fungible_asset::generate_transfer_ref(&metadata_object_cref);
            let burn_ref = fungible_asset::generate_burn_ref(&metadata_object_cref);
            move_to(metadata_object_signer,
                PairedFungibleAssetRefs {
                    mint_ref_opt: option::some(mint_ref),
                    transfer_ref_opt: option::some(transfer_ref),
                    burn_ref_opt: option::some(burn_ref),
                }
            );
        };
        *table::borrow(&map.coin_to_fungible_asset_map, type)
    }

    /// Get the paired fungible asset metadata object of a coin type, create if not exist.
    public(friend) fun ensure_paired_metadata<CoinType>(): Object<Metadata> acquires CoinConversionMap {
        create_and_return_paired_metadata_if_not_exist<CoinType>(false)
    }

    #[view]
    /// Get the paired coin type of a fungible asset metadata object.
    public fun paired_coin(metadata: Object<Metadata>): Option<TypeInfo> acquires PairedCoinType {
        let metadata_addr = object::object_address(&metadata);
        if (exists<PairedCoinType>(metadata_addr)) {
            option::some(borrow_global<PairedCoinType>(metadata_addr).type)
        } else {
            option::none()
        }
    }

}






