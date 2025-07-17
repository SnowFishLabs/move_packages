module test::test{
    use aptos_framework::event;

    #[event]
    struct TestEvent has drop, store {
        a: address,
        b: u64
    }

    public entry fun test() {
        
    }

    public entry fun test2(a: address, b: u64) {
        event::emit(TestEvent {
            a,
            b
        })
    }
 
    #[test]
    fun test_addition() {
        test();
    }  
}