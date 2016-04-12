package hackAssembler;

public class Instruction {
	private boolean[] bitArray = new boolean[16];
	private String assemblyWord;
	private String machineWord;
	
	public Instruction(){
		this.setBits(0, false, false, false, false, false, false, false);//set all bits to 0
		this.setBits(7, false, false, false, false, false, false, false);
		this.setBit(14, false);
		this.setBit(15, false);
	}
	
	public boolean getBit(int index){return this.bitArray[index];}
	//set 1 bit
	public void setBit(int index, boolean value){this.bitArray[index]=value;}
	//set 3 bits
	public void setBits(int startIndex, boolean value1, boolean value2, boolean value3){
		this.setBit(startIndex,value1);
		this.setBit(startIndex+1, value2);
		this.setBit(startIndex+2, value3);
	}
	//set 7 bits
	public void setBits(int startIndex, boolean value1, boolean value2, boolean value3, boolean value4, boolean value5, boolean value6, boolean value7){
		this.setBits(startIndex, value1, value2, value3);
		this.setBits(startIndex+3, value4, value5, value6);
		this.setBit(startIndex+6, value7);
	}
	
	public void setAssemblyWord(String input){assemblyWord=input;}
	public String getAssemblyWord(){return assemblyWord;}
	
	public void createMachineWord(){//turn bitArray into 'machineWord,' which is a string of characters
		machineWord="";
		for (boolean bit:bitArray){	
			String temp=(bit? "1":"0");
			machineWord = temp + machineWord;//turn the bit array into a string of characters
		}
	}
	public String getMachineWord(){return machineWord;}
	
	public void parse(){}
}
