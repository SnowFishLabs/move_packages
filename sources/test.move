module test::test{
    use aptos_framework::event;

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
        event::emit(TestEvent3 {
            a: list,
        })
    }
 
    #[test]
    fun test_addition() {
        test();
    }  
}