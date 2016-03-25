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
	public static void main(String[] args) throws IOException{
		Scanner fin = new Scanner(new FileReader("Program.hack"));//open input file
		FileWriter fout = new FileWriter("C:\\Users\\Shira\\Desktop\\Program.asm");//open output file
		String nextLine;
		while (fin.hasNext()){
			nextLine=fin.nextLine();//read the next line of assembly code from the file
			Word currWord;//get a Word object ready
			//make sure the current word isn't a comment or a blank line:
			if (!(nextLine.startsWith("/") || nextLine.startsWith("*")|| nextLine.isEmpty())){
				if (nextLine.startsWith("@")){
					currWord = new Ainstruction();//if it starts with @, this Word is an A-instruction
				}else{
					currWord = new Cinstruction();//otherwise, this Word is a C-instruction
				}
				currWord.setAssemblyWord(nextLine);//store the line of assembly code as our next word to be assembled
				currWord.parse();//parse and assemble the word according to its A- or C-instruction method			
				fout.write(currWord.getMachineWord()+"\r\n");//output the machine code to the file
			}
		}
		fin.close();//close input file
		fout.close();//close output file
	}
}
