package hackAssembler;

public class Ainstruction extends Instruction{
	public Ainstruction(){
		this.setBit(15, false);//set first, op-bit to '0'(0xxx xxxx xxxx xxxx)
	}
	
	public void parse(){	
		if (this.getAssemblyWord().substring(1).matches("\\d+")){
		int address = Integer.valueOf(this.getAssemblyWord().substring(1));
		for(int n=14;n>=0;n--){
			if ((address-Math.pow(2,n))>=0){
				this.setBit(n,true);
				address-=Math.pow(2, n);
			}else{
				this.setBit(n,false);
			}
		}
		this.createMachineWord(); 
		}else{
			System.out.println("AssemblyWord is not a number!  It is: "+this.getAssemblyWord());
		}
	}
}
