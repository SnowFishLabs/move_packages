module test::test{
    public entry fun test() {
        // This is a test function
        let x = 5;
        let y = 95;
        let z = x + y;
        assert!(z == 100, 0);
    }
 
    #[test]
    fun test_addition() {
        test();
    }  
}