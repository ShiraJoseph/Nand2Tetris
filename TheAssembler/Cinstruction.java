package hackAssembler;

public class Cinstruction extends Instruction {
	private String dest = "";
	private String comp = "";
	private String jump = "";

	public Cinstruction() {
		this.setBits(13, true, true, true);//set first three bits to '111' (111x xxxx xxxx xxxx)
	}

	public void parse() {
		int compBegin = 0;//if there is no 'dest,' 'comp' can be found at the beginning of the string
		int compEnd = this.getAssemblyWord().length();//if there is no 'jump,' 'comp' ends at the end of the string
		if (this.getAssemblyWord().contains("=")) {//if the instruction has an equals sign, extract 'dest'
			dest = this.getAssemblyWord().substring(0, this.getAssemblyWord().indexOf("="));
			compBegin = dest.length() + 1;//find where 'dest' ends and 'comp' should begin
		}
		if (this.getAssemblyWord().contains(";")) {//if the instruction has a semicolon, extract 'jump'
			jump = this.getAssemblyWord().substring(this.getAssemblyWord().indexOf(";") + 1,this.getAssemblyWord().length());
			compEnd = this.getAssemblyWord().length() - jump.length() - 1;//where 'jump' begins and 'comp' should end
		}
		
		comp = this.getAssemblyWord().substring(compBegin, compEnd);//extract 'comp' from between 'dest' and 'jump'

		if ((dest != "" || jump != "") && (comp != "")) {
			//if the instruction is in the form "dest=comp;jump" or "comp;jump" or "dest=comp", go ahead and assemble it!
			this.assembleComp();
			this.assembleDest();
			this.assembleJump();
			this.createMachineWord();
		} else {//if not, the input file isn't formatted correctly
			System.out.println("Incorrect file format");
		}
	}

	private void assembleComp() {
		switch (comp) {//assemble next seven bits according to the 'comp' instruction (111c cccc ccxx xxxx)
		case "0": this.setBits(6, false, true, false, true, false, true, false); break;//0 1010 10
		case "1": this.setBits(6, true, true, true, true, true, true, false); break;//0 1111 11
		case "-1": this.setBits(6, false, true, false, true, true, true, false); break;//0 1110 10
		case "D": this.setBits(6, false, false, true, true, false, false, false); break;//0 0011 00
		case "A": this.setBits(6, false, false, false, false, true, true, false); break;//0 1100 00
		case "!D": this.setBits(6, true, false, true, true, false, false, false); break;//0 0011 01
		case "!A": this.setBits(6, true, false, false, false, true, true, false); break;//0 1100 01
		case "-D": this.setBits(6, true, true, true, true, false, false, false); break;//0 0011 11
		case "-A": this.setBits(6, true, true, false, false, true, true, false); break;//0 1100 11
		case "D+1": this.setBits(6, true, true, true, true, true, false, false); break;//0 0111 11
		case "A+1": this.setBits(6, true, true, true, false, true, true, false); break;//0 1101 11
		case "D-1": this.setBits(6, false, true, true, true, false, false, false); break;//0 0011 10
		case "A-1": this.setBits(6, false, true, false, false, true, true, false); break;//0 1100 10
		case "D+A": this.setBits(6, false, true, false, false, false, false, false); break;//0 0000 10
		case "D-A": this.setBits(6, true, true, false, false, true, false, false); break;//0 0100 11
		case "A-D": this.setBits(6, true, true, true, false, false, false, false); break;//0 0001 11
		case "D&A": this.setBits(6, false, false, false, false, false, false, false); break;//0 0000 00
		case "D|A": this.setBits(6, true, false, true, false, true, false, false); break;//0 0101 01
		case "M": this.setBits(6, false, false, false, false, true, true, true); break;// 1 1100 00
		case "!M": this.setBits(6, true, false, false, false, true, true, true); break;//1 1100 01
		case "-M": this.setBits(6, true, true, false, false, true, true, true);	break;//1 1100 11
		case "M+1": this.setBits(6, true, true, true, false, true, true, true); break;//1 1101 11
		case "M-1": this.setBits(6, false, true, false, false, true, true, true); break;//1 1100 10
		case "D+M": this.setBits(6, false, true, false, false, false, false, true); break;//1 0000 10
		case "D-M":	this.setBits(6, true, true, false, false, true, false, true); break;//1 0100 11
		case "M-D":	this.setBits(6, true, true, true, false, false, false, true); break;//1 0001 11
		case "D&M":	this.setBits(6, false, false, false, false, false, false, true); break;//1 0000 00
		case "D|M":	this.setBits(6, true, false, true, false, true, false, true); break;//1 0101 01
		default: System.out.println("Incorrect file format");
		}
	}

	private void assembleDest() {
		switch (dest) {//assemble next three bits according to the 'dest' instruction (111c cccc ccdd dxxx)
		case "": this.setBits(3, false, false, false); break;//00 0 (don't store comp)
		case "M": this.setBits(3, true, false, false); break;//00 1 (store comp in M-register)
		case "D": this.setBits(3, false, true, false); break;//01 0 (store comp in D-register)
		case "MD": this.setBits(3, true, true, false); break;//01 1 (store comp in M- and D-registers)
		case "A": this.setBits(3, false, false, true); break;//10 0 (store comp in A-register)
		case "AM": this.setBits(3, true, false, true); break;//10 1 (store comp in A- and M-registers)
		case "AD": this.setBits(3, false, true, true); break;//11 0 (store comp in A- and D-registers)
		case "AMD": this.setBits(3, true, true, true); break;//11 1 (store comp in all; A-, M-, and D-registers)
		}
	}

	private void assembleJump() {
		switch (jump) {//assemble final three bits according to the 'jump' instruction (111c cccc ccdd djjj)
		case "": this.setBits(0, false, false, false); break;//000 (no jump)
		case "JGT":	this.setBits(0, true, false, false); break;//001 (address>0)
		case "JEQ":	this.setBits(0, false, true, false); break;//010 (address==0)
		case "JGE": this.setBits(0, true, true, false);	break;//011 (address>=0)
		case "JLT":	this.setBits(0, false, false, true); break;//100 (address<0)
		case "JNE":	this.setBits(0, true, false, true);	break;//101 (address!=0)
		case "JLE":	this.setBits(0, false, true, true);	break;//110 (address<=0)
		case "JMP": this.setBits(0, true, true, true);	break;//111 (unconditional jump)
		}
	}
}
