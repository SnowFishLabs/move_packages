module test::test{
    use aptos_framework::event;
    // use aptos_packages::test::{test3 as test5};
    #[test_only]
    use aptos_std::debug;

    #[event]
    struct TestEvent has drop, store {
        a: address,
        b: u64
    }

    #[event]
    struct TestEvent3 has drop, store {
        a: vector<address>
    }

    public entry fun test() {
        
    }

    public entry fun test2(a: address, b: u64) {
        event::emit(TestEvent {
            a,
            b
        })
    }

    public entry fun test3(list: vector<address>) {
        // test5(list);
        
        event::emit(TestEvent3 {
            a: list,
        })
    }
 
    #[test]
    fun test_addition() {
        // test();
        let a = 9/2;
        debug::print(&a)
    }  
}