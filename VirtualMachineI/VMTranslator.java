import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

public class VMTranslator {

	public static void main(String[] args) {
		_line = 0;
		_isCheckFile = false;
		String checkFile = _isCheckFile ? "_check" : "";
		File inputFile = new File (args.length > 0 ? args[0]
				: "C:\\Users\\Shira\\Google Drive\\Work\\School\\Coursera\\Nand2Tetris\\nand2tetris"
						+ "\\projects\\08\\FunctionCalls\\NestedCall");

		try {
			List<File> results = new ArrayList<File>();
			if (inputFile.isDirectory()) {
				File[] files = inputFile.listFiles();
				for (File file : files) {
					if (file.isFile() && file.getName().contains(".vm")) {
						results.add(file);
					}
				}
			} else if (inputFile.isFile()) {
				results.add(inputFile);
			}
			System.out.println("inputfile is: "+ inputFile.getName());
			File ASMFile = new File(inputFile.getPath()+"/"+inputFile.getName() + checkFile + ".asm");
			FileOutputStream fos = new FileOutputStream(ASMFile);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			BufferedWriter bufferedWriter = new BufferedWriter(osw);
			_VMcommand = "call Sys.init 0";
			trimCommand();
			translate();
			String tempString=append(new String[]{"@256","D=A","@0","M=D",_ASMcommand});
			bufferedWriter.write(tempString);
			System.out.println(tempString);
			_count = 0;
			for (File VMfile : results) {
				FileInputStream fis = new FileInputStream(VMfile);
				InputStreamReader isr = new InputStreamReader(fis);
				BufferedReader bufferedReader = new BufferedReader(isr);

				
				_VMcommand = "";

				while ((_VMcommand = bufferedReader.readLine()) != null) {
					_ASMcommand = "";
					trimCommand();

					if (_isCode) {
						translate();
						System.out.println(_ASMcommand);
						bufferedWriter.write(_ASMcommand);
						_count++;
					}
				}

				bufferedReader.close();
			}
			System.out.println("File is: " + ASMFile.getName());
			bufferedWriter.close();
			System.out.println("path: "+ inputFile.getPath());
			System.out.println("/");
		} catch (IOException e) {
			System.out.println(e);
		}
	}

	public static void trimCommand() {
		_isCode = true;
		if (_VMcommand.contains("/")) {
			if (_VMcommand.indexOf("/") > 1) {
				_VMcommand = _VMcommand.substring(0, _VMcommand.indexOf("/") - 1);

			} else {
				_ASMcommand = "";
				_isCode = false;
			}
		}
		if (_VMcommand.isEmpty()) {
			_ASMcommand = "";
			_isCode = false;
		}
		_VMcommand = _VMcommand.trim();

	}

	public static String pushPop(String p) {
		String segment = _VMcommand.substring(_VMcommand.indexOf(" ") + 1, _VMcommand.lastIndexOf(" ")).trim();
		switch (segment.toLowerCase()) {
		case "constant":
			return i() + nL() + "D=A" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1"
					+ nL();
		case "local":
			return "LCL" + nL()
					+ (p == "push"
							? "D=M" + nL() + "@" + i() + nL() + "A=D+A" + nL() + "D=M" + nL() + "@SP" + nL() + "A=M"
									+ nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1" + nL()
							: "D=M" + nL() + "@" + i() + nL() + "D=D+A" + nL() + "@R13" + nL() + "M=D" + nL() + "@SP"
									+ nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@R13" + nL() + "A=M" + nL()
									+ "M=D" + nL());
		case "argument":
			return "ARG" + nL()
					+ (p == "push"
							? "D=M" + nL() + "@" + i() + nL() + "A=D+A" + nL() + "D=M" + nL() + "@SP" + nL() + "A=M"
									+ nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1" + nL()
							: "D=M" + nL() + "@" + i() + nL() + "D=D+A" + nL() + "@R13" + nL() + "M=D" + nL() + "@SP"
									+ nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@R13" + nL() + "A=M" + nL()
									+ "M=D" + nL());
		case "this":
			return "THIS" + nL()
					+ (p == "push"
							? "D=M" + nL() + "@" + i() + nL() + "A=D+A" + nL() + "D=M" + nL() + "@SP" + nL() + "A=M"
									+ nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1" + nL()
							: "D=M" + nL() + "@" + i() + nL() + "D=D+A" + nL() + "@R13" + nL() + "M=D" + nL() + "@SP"
									+ nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@R13" + nL() + "A=M" + nL()
									+ "M=D" + nL());
		case "that":
			return "THAT" + nL()
					+ (p == "push"
							? "D=M" + nL() + "@" + i() + nL() + "A=D+A" + nL() + "D=M" + nL() + "@SP" + nL() + "A=M"
									+ nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1" + nL()
							: "D=M" + nL() + "@" + i() + nL() + "D=D+A" + nL() + "@R13" + nL() + "M=D" + nL() + "@SP"
									+ nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@R13" + nL() + "A=M" + nL()
									+ "M=D" + nL());
		case "static":
			int bar = -1;
			if (_inputFile.contains("/")) {
				bar = _inputFile.lastIndexOf("/");
			} else if (_inputFile.contains("\\")) {
				bar = _inputFile.lastIndexOf("\\");
			}
			String stat = _inputFile.substring(bar + 1, _inputFile.indexOf(".") + 1) + i();
			if (p == "push")
				return stat + nL() + "D=M" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1"
						+ nL();
			if (p == "pop") {
				return "SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@" + stat + nL() + "M=D" + nL();
			}
			break;
		case "temp":
			return "5" + nL() + "D=A" + nL() + "@" + i()
					+ (p == "push"
							? nL() + "A=D+A" + nL() + "D=M" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL() + "@SP"
									+ nL() + "M=M+1" + nL()
							: nL() + "D=D+A" + nL() + "@R13" + nL() + "M=D" + nL() + "@SP" + nL() + "M=M-1" + nL()
									+ "A=M" + nL() + "D=M" + nL() + "@R13" + nL() + "A=M" + nL() + "M=D" + nL());
		case "pointer":
			String point = i() == 0 ? "THIS" : "THAT";
			return p == "push"
					? point + nL() + "D=M" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1"
							+ nL()
					: "SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@" + point + nL() + "M=D" + nL();
		default:
			return segment;

		}
		return segment;
	}

	public static String commandType() {
		int commandEnd = (_VMcommand.contains(" ") ? _VMcommand.indexOf(" ") : _VMcommand.length());
		return _VMcommand.substring(0, commandEnd).trim();
	}

	public static int i() {
		int address = Integer.parseInt(_VMcommand.substring(_VMcommand.lastIndexOf(" ") + 1, _VMcommand.length()));

		return address;
	}

	public static void translate() {
		if (_isCode) {
			String comment = "//" + _VMcommand + "\n";

			String type = commandType();
			switch (type) {
			case "push":
				_ASMcommand = comment + "@" + pushPop("push");
				break;
			case "pop":
				_ASMcommand = comment + "@" + pushPop("pop");
				break;
			case "and":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@SP" + nL()
						+ "M=M-1" + nL() + "A=M" + nL() + "D=D&M" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL()
						+ "@SP" + nL() + "M=M+1" + nL();
				break;
			case "or":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@SP" + nL()
						+ "M=M-1" + nL() + "A=M" + nL() + "D=D|M" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL()
						+ "@SP" + nL() + "M=M+1" + nL();
				break;
			case "neg":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "M=-M" + nL() + "@SP" + nL()
						+ "M=M+1" + nL();
				break;
			case "not":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "M=!M" + nL() + "@SP" + nL()
						+ "M=M+1" + nL();
				break;
			case "add":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@SP" + nL()
						+ "M=M-1" + nL() + "A=M" + nL() + "D=D+M" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL()
						+ "@SP" + nL() + "M=M+1" + nL();
				break;
			case "sub":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@SP" + nL()
						+ "M=M-1" + nL() + "A=M" + nL() + "D=M-D" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL()
						+ "@SP" + nL() + "M=M+1" + nL();
				break;
			case "eq":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@SP" + nL()
						+ "M=M-1" + nL() + "A=M" + nL() + "D=M-D" + nL() + "@false" + _count + nL() + "D;JNE" + nL()
						+ "@SP" + nL() + "A=M" + nL() + "M=-1" + nL() + "@true" + _count + nL() + "0;JMP" + nL()
						+ "(false" + _count + ")" + nL() + "@SP" + nL() + "A=M" + nL() + "M=0" + nL() + "(true" + _count
						+ ")" + nL() + "@SP" + nL() + "M=M+1" + nL();
				break;
			case "lt":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@SP" + nL()
						+ "M=M-1" + nL() + "A=M" + nL() + "D=M-D" + nL() + "@false" + _count + nL() + "D;JGE" + nL()
						+ "@SP" + nL() + "A=M" + nL() + "M=-1" + nL() + "@true" + _count + nL() + "0;JMP" + nL()
						+ "(false" + _count + ")" + nL() + "@SP" + nL() + "A=M" + nL() + "M=0" + nL() + "(true" + _count
						+ ")" + nL() + "@SP" + nL() + "M=M+1" + nL();
				break;
			case "gt":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@SP" + nL()
						+ "M=M-1" + nL() + "A=M" + nL() + "D=M-D" + nL() + "@false" + _count + nL() + "D;JLE" + nL()
						+ "@SP" + nL() + "A=M" + nL() + "M=-1" + nL() + "@true" + _count + nL() + "0;JMP" + nL()
						+ "(false" + _count + ")" + nL() + "@SP" + nL() + "A=M" + nL() + "M=0" + nL() + "(true" + _count
						+ ")" + nL() + "@SP" + nL() + "M=M+1" + nL();
				break;
			case "label":
				_ASMcommand = comment + "(" + _VMcommand.substring(_VMcommand.lastIndexOf(" ") + 1, _VMcommand.length())
						+ ")" + nL();
				break;
			case "if-goto":
				_ASMcommand = comment + "@SP" + nL() + "M=M-1" + nL() + "A=M" + nL() + "D=M" + nL() + "@"
						+ _VMcommand.substring(_VMcommand.lastIndexOf(" ") + 1, _VMcommand.length()) + nL() + "D;JNE"
						+ nL();
				break;
			case "goto":
				_ASMcommand = comment + "@" + _VMcommand.substring(_VMcommand.lastIndexOf(" ") + 1, _VMcommand.length())
						+ nL() + "0;JMP" + nL();
				break;
			case "call":
				_ASMcommand = comment + "//->push returnAddress\n" + "@retAddr" + _count + nL() + "D=A" + nL() + "@SP"
						+ nL() + "A=M" + nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1" + nL() + "//->push LCL\n" + "@LCL"
						+ nL() + "D=M" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1"
						+ nL() + "//->push ARG\n" + "@ARG" + nL() + "D=M" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D"
						+ nL() + "@SP" + nL() + "M=M+1" + nL() + "//->push THIS\n" + "@THIS" + nL() + "D=M" + nL()
						+ "@SP" + nL() + "A=M" + nL() + "M=D" + nL() + "@SP" + nL() + "M=M+1" + nL() + "//->push THAT\n"
						+ "@THAT" + nL() + "D=M" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL() + "@SP" + nL()
						+ "M=M+1" + nL() + "//->ARG=SP-5-nArgs\n" + "@SP" + nL() + "D=M" + nL() + "@5" + nL() + "D=D-A"
						+ nL() + "@" + _VMcommand.substring(_VMcommand.lastIndexOf(" ") + 1, _VMcommand.length()) + nL()
						+ "D=D-A" + nL() + "@ARG" + nL() + "M=D" + nL() + "//->LCL=SP\n" + "@SP" + nL() + "D=M" + nL()
						+ "@LCL" + nL() + "M=D" + nL() + "//->goto functionName\n" + "@"
						+ _VMcommand.substring(_VMcommand.indexOf(" ") + 1, _VMcommand.lastIndexOf(" ")) + nL()
						+ "0; JMP" + nL() + "//->(returnAddress)\n" + "(retAddr" + _count + ")" + nL();
				break;
			case "function":
				_ASMcommand = comment + "("
						+ _VMcommand.substring(_VMcommand.indexOf(" ") + 1, _VMcommand.lastIndexOf(" ")) + ")" + nL()
						+ "//->initialize n\n" + "@"
						+ _VMcommand.substring(_VMcommand.lastIndexOf(" ") + 1, _VMcommand.length()) + nL() + "D=A"
						+ nL() + "@n" + _count + nL() + "M=D" + nL() + "//->while n!=0\n" + "(LOOP" + _count + ")"
						+ nL() + "@n" + _count + nL() + "D=M" + nL() + "@END" + _count + nL() + "D;JEQ" + nL()
						+ "//->push 0\n" + "@0" + nL() + "D=A" + nL() + "@SP" + nL() + "A=M" + nL() + "M=D" + nL()
						+ "@SP" + nL() + "M=M+1" + nL() + "//->n--\n" + "@n" + _count + nL() + "M=M-1" + nL() + "@LOOP"
						+ _count + nL() + "0;JMP" + nL() + "(END" + _count + ")" + nL();

				break;
			case "return":
				_ASMcommand = comment + append(new String[] { "//->endFrame = LCL\n", "@LCL", "D=M", "@R13",
						"M=D\n" + "//->retAddr=*(endFrame-5)", "@5", "A=D-A", "D=M", "@R14", "M=D\n" + "//->*ARG=pop()",
						"@SP", "M=M-1", "A=M", "D=M", "@ARG", "A=M", "M=D\n" + "//->SP=ARG+1", "@ARG", "D=M+1", "@SP",
						"M=D\n" + "//->THAT=*(endFrame-1)", "@R13", "A=M-1", "D=M", "@THAT",
						"M=D\n" + "//->THIS=*(endFrame-2)", "@R13", "D=M", "@2", "A=D-A", "D=M", "@THIS",
						"M=D\n" + "//->ARG=*(endFrame-3)", "@R13", "D=M", "@3", "A=D-A", "D=M", "@ARG",
						"M=D\n" + "//->LCL=*(endFrame-4)", "@R13", "D=M", "@4", "A=D-A", "D=M", "@LCL",
						"M=D\n" + "//->goto retAddr", "@R14", "A=M", "0;JMP\n" });
				break;
			default:
				_ASMcommand = "";
			}
		}
	}

	public static String nL() {
		if (_isCode) {
			int n = 0;
			if (_isCheckFile) {
				n = _line;
				_line++;
				return "\n" + n + "\t";
			}
		}
		return "\n";
	}

	public static String append(String[] lines) {
		String codeString = "";
		for (String line : lines) {
			codeString += nL() + line;
		}
		return codeString;
	}

	private static String _inputFile;
	private static String _VMcommand;
	private static String _ASMcommand;
	private static int _count;
	private static int _line;
	private static boolean _isCode;
	private static boolean _isCheckFile;

}
