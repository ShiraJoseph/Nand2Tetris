package hackAssembler;
import java.io.*;
import java.util.*;

/**
 * An assembler that generates a Hack Machine Language file(.hack)
 * from a Hack Assembly Language file(.asm).  The .hack file can then be
 * loaded and run on a Hack computer.
 * 
 * @author Shira Friedman
 *
 */
public class HackAssembler {
	public static ArrayList<Symbol> symbolTable = new ArrayList<Symbol>();
	public static ArrayList<Instruction> instructions = new ArrayList<Instruction>();
	
	public static void main(String[] args) throws IOException{
		readFileToStoreLinesAndSymbols();
		parseInstructionsToPrintToFile();
	}
		
	private static void readFileToStoreLinesAndSymbols() throws FileNotFoundException {
		//store predefined symbols in the symbolTable
		addPredefinedSymbolsToSymbolTable();
		
		Scanner fin = new Scanner(new FileReader("Pong.asm"));//open input file 															
		String nextLine;
		while (fin.hasNext()){ 													
			nextLine=fin.nextLine().trim();//read next line 									
			if(!(nextLine.startsWith("/") || nextLine.startsWith("*")|| nextLine.isEmpty())){//skip comments and blank lines			
				if (nextLine.contains("/")){//remove in-line comments
					nextLine=nextLine.substring(0, nextLine.indexOf("/")-1).trim();
				}	
				//check for references
				boolean isReference=false;
				if(nextLine.startsWith("(")){
					isReference=true;
					System.out.print("just changed nextLine "+nextLine);
					nextLine="@"+nextLine.substring(1, nextLine.indexOf(")"));
					System.out.println(" to "+ nextLine);
					
				}
				//store user variables and references in the symbolTable
				if(nextLine.startsWith("@")&&(!(nextLine.substring(1).matches("\\d+")))){//look at lines that are @string or references
					System.out.println("'"+nextLine+"' starts with @ and isn't a number");
					boolean newSymbol=true;
					for (Symbol symbol:symbolTable){//check if the line is already in symbolTable
						if(nextLine.equals(symbol.getName())){
							System.out.println("symbol ["+symbol.getName()+","+symbol.getValue()+"] is already in symbolTable");
							if (isReference){
								System.out.println("nextLine is a reference, though, so remove previous symbol");
								symbolTable.remove(symbolTable.indexOf(symbol));
								break;
							}
							newSymbol=false;
							break;
						}
					}
					if(newSymbol){
						symbolTable.add(new Symbol(nextLine,instructions.size()));//store the new variable
						System.out.println("just added symbol ["+symbolTable.get(symbolTable.size()-1).getName()+","+symbolTable.get(symbolTable.size()-1).getValue()+"]");
					}
				}
				//store all the lines as instructions (excluding reference lines)
				if(!(isReference)){
					Instruction instruction;
					instruction=(nextLine.startsWith("@"))? new Ainstruction():new Cinstruction();//determine the instruction type
					instruction.setAssemblyWord(nextLine);
					instructions.add(instruction);
				}
			}
		}//end while
		fin.close();//close input file
	}

	private static void addPredefinedSymbolsToSymbolTable() {
		for(int i=0;i<16;i++){
			symbolTable.add(new Symbol("@R"+i,i));//@R0 refers to @0, @R1 to 1, etc.
		}
		symbolTable.add(new Symbol("@SP",0));
		symbolTable.add(new Symbol("@LCL",1));
		symbolTable.add(new Symbol("@ARG",2));
		symbolTable.add(new Symbol("@THIS",3));
		symbolTable.add(new Symbol("@THAT",4));
		symbolTable.add(new Symbol("@SCREEN",16384));
		symbolTable.add(new Symbol("@KBD",24576));
	}
	
	private static void parseInstructionsToPrintToFile() throws IOException {
		FileWriter fout = new FileWriter("C:\\Users\\Shira\\Desktop\\Pong.hack");//open output file
		for(Instruction instruction: instructions){	
			//System.out.println("For instruction assemblyWord '"+instruction.getAssemblyWord()+"'");
			for(Symbol symbol: symbolTable){ 									
				if (instruction.getAssemblyWord().equals(symbol.getName())){ 
					instruction.setAssemblyWord("@"+Integer.toString(symbol.getValue()));
					System.out.println("          They were equal - AssemblyWord is now '"+instruction.getAssemblyWord()+"'");
					break;
				}
			}			
			instruction.parse();//parse and assemble the instruction according to its A- or C-instruction method			
			fout.write(instruction.getMachineWord()+"\r\n");
		}	
		fout.close();//close output file
	}
}


