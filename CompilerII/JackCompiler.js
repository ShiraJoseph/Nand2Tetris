import Token from "./Token.js";
import fs from 'fs';
import {
    AMPERSAND,
    ARGUMENT,
    ASTERISK,
    CLASS,
    CLASS_VAR_DEC,
    CLOSE_PAREN,
    COMMA,
    CONSTRUCTOR,
    DO,
    DO_STATEMENT,
    ELSE,
    END_TAG,
    EQUALS,
    EXPRESSION,
    EXPRESSION_LIST,
    FALSE,
    FIELD,
    FUNCTION,
    GREATER_THAN,
    IDENTIFIER,
    IF,
    IF_STATEMENT,
    INT_CONST,
    LESS_THAN,
    LET,
    LET_STATEMENT,
    LOCAL,
    METHOD,
    MINUS,
    NULL,
    OPEN_BRACKET,
    OPEN_PAREN,
    ops,
    PARAM_LIST,
    PERIOD,
    PIPE,
    PLUS,
    RETURN,
    RETURN_STATEMENT,
    SEMICOLON,
    SLASH,
    START_TAG,
    STATEMENTS,
    STATIC,
    STRING_CONST,
    SUBROUTINE_BODY,
    SUBROUTINE_DEC,
    TERM,
    THIS,
    TILDE,
    TRUE,
    VAR,
    VAR_DEC,
    WHILE,
    WHILE_STATEMENT
} from "./constants.js";
import {SymbolTable} from "./SymbolTable.js";


/**
 * Main Compiler class
 */
export class JackCompiler {
    i;
    typedTokens;
    xmlElements;
    symbolTable = new SymbolTable();
    vmInstructions;
    className;
    labelCount = 0;


    // region Helpers

    constructor() {
        this.init();
    }

    get curr() {
        return this.typedTokens?.[this.i]?.value;
    }

    get next() {
        return this.typedTokens?.[this.i + 1]?.value;
    }

    /** Whether the current line of code is the given value */
    is = (val) => this.curr === val;

    /** Whether the type of the current line of code is the given type */
    isType = (type) => this.typedTokens?.[this.i]?.type === type

    /** Add token for start tag */
    open = (type) => this.xmlElements?.push(new Token(START_TAG, type))

    /** Add token for end tag */
    close = (type) => this.xmlElements?.push(new Token(END_TAG, type))

    /** Add token for line of code */
    add = () => {
        this.xmlElements?.push(this.typedTokens?.[this.i])
        return this.typedTokens?.[this.i].value
    }

    /** Add token and advance */
    addPlus = () => {
        const next = this.add();
        this.i++;
        return next;
    }

    /** Add two tokens and advance */
    addTwice = () => {
        return ([this.addPlus(), this.addPlus()])
    }

    /** Add three tokens and advance */
    addThrice = () => {
        return [...this.addTwice(), this.addPlus()];
    }

    // endregion

    /**
     * Initializes the file(s) for analysis
     */
    init() {
        const args = process.argv.slice(2);
        const inputPath = args[0];

        fs.stat(inputPath, (err, stats) => {
            stats?.isDirectory() && fs.readdir(inputPath, (err, files) => {
                files.forEach((filename) => {
                    filename.endsWith('.jack') && (() => {
                        const inputFilePath = inputPath + '/' + filename;
                        this.createFile(inputFilePath);

                    })();
                });
            });

            stats?.isFile() && inputPath.endsWith('.jack') && (() => {
                this.createFile(inputPath);
            })();
        });
    }

    /**
     * Reads a single jack file and writes the compilation result in a vm file
     * @param inputFilePath
     */
    createFile(inputFilePath) {
        const correctFile = inputFilePath
        const outputFilePath = inputFilePath.replace('jack', 'vm');
        fs.readFile(inputFilePath, 'utf8', (err, data) => {
            const result = this.compile(data);
            fs.writeFile(outputFilePath, result, (err) => {


            const testFilePath = inputFilePath.replace('.jack', '.correct.vm');
            fs.readFile(testFilePath, 'utf8', (err, data1) => {
                console.log('TEST', testFilePath, 'against', outputFilePath)
                const testRows = data1.split('\n').filter(row => !row.includes('goto') && !row.includes('label'));
                const actualRows = result.split('\n').filter((row, i) => !(row.includes('not') && result.split('\n')[i+1].includes('if-goto')) && !row.includes('goto') && !row.includes('label'));
                for (let testIndex = 0, resultIndex = 0; (resultIndex < actualRows.length) && (testIndex < testRows.length);) {
                    console.assert(testRows[testIndex] === actualRows[resultIndex], 'Expected:', testRows[testIndex]+'. Actual:', actualRows[resultIndex], '-- LINE', resultIndex);
                    testIndex++;
                    resultIndex++;
                }
            });
            });
        });
    }

    /**
     * Compiles the lines of jack code into lines of vm code
     * @param data
     * @returns {string}
     */
    compile(data) {
        this.i = 0;
        this.xmlElements = [];
        this.typedTokens = this.tokenize(data);
        this.labelCount = 0;

        this.compileClass();

        // return this.xmlElements?.map(token => token?.wrapped)?.join('\n');
        return this.vmInstructions?.join('\n');
    }

    /**
     * Splits up the jack file content by line into Tokens, each with a value and a (generated by Token constructor) type
     */
    tokenize(data) {
        return data
            .split('\n')
            .map(row => row
                .replace(/((\/\/)|(\/\*)|(\/\*\*)).+/, '')
                .trimStart())
            .filter(row => !row.startsWith('*'))
            .join('\n')
            .match(/(\d+|\w+|["'](.*?)["'])|[^\w\s]/g)
            .map(token => new Token(token, null));
    }

    // 'class' identifier '{' classVarDec* subroutineDec* '}'
    compileClass = () => {
        this.vmInstructions = [];

        this.open(CLASS);

        this.symbolTable.resetClassVars();
        const classCall = this.addThrice(); // 'class' identifier '{'
        this.className = classCall[1];

        while ([STATIC, FIELD]?.includes(this.curr)) {
            this.compileClassVarDec();
            this.i++;
        }
        while ([CONSTRUCTOR, FUNCTION, METHOD]?.includes(this.curr)) {
            this.compileSubroutineDec();
        }
        this.add() // '}'

        this.close(CLASS)
    }

    // ('static' | 'field') type identifier (',' identifier)* ';'
    compileClassVarDec = () => {
        this.open(CLASS_VAR_DEC);

        const firstVar = this.addThrice(); // ('static' | 'field') type identifier
        this.symbolTable.addVar(...firstVar)

        while (this.is(COMMA)) {
            const nextVar = this.addTwice(); // ',' identifier
            this.symbolTable.addVar(firstVar[0], firstVar[1], nextVar[1])

        }
        this.add(); // ';'

        this.close(CLASS_VAR_DEC);
    }

    // ('constructor' | 'function' | 'method') type identifier '(' parameterList ')' subroutineBody
    compileSubroutineDec = () => {
        this.open(SUBROUTINE_DEC);

        const subroutine = this.addTwice(); // ('constructor' | 'function' | 'method') type
        const subroutineName = this.addTwice(); // identifier '('

        this.symbolTable.resetRoutineVars();
        if (subroutine[0] === CONSTRUCTOR) {
            this.vmInstructions.push('function ' + this.className + '.new 0');
            this.vmInstructions.push('push constant ' + Number(this.symbolTable.fieldCount || 0));
            this.vmInstructions.push('call Memory.alloc 1');
            this.vmInstructions.push('pop pointer 0');
            this.compileParameterList();
        } else if (subroutine[0] === METHOD) {
            this.symbolTable.setContext(subroutine[1], subroutineName[0])

            this.compileParameterList();
            this.vmInstructions.push('function ' + this.className + '.' + subroutineName[0] + ' ' + Number(this.symbolTable.argCount || 0));
            this.vmInstructions.push('push argument 0');
            this.vmInstructions.push('pop pointer 0');
        } else {
            this.compileParameterList();
            this.vmInstructions.push('function ' + this.className + '.' + subroutineName[0] + ' ' + Number(this.symbolTable.argCount || 0));
        }
        this.addPlus(); // ')'
        this.compileSubroutineBody();
        this.i++;

        this.close(SUBROUTINE_DEC);
    }

    // (type identifier (',' type identifier)*)?
    compileParameterList = () => {
        this.open(PARAM_LIST);

        if (!this.is(CLOSE_PAREN)) {
            const firstParam = this.addTwice(); // type identifier
            this.symbolTable.addVar(ARGUMENT, ...firstParam)

            while (this.is(COMMA)) {
                const nextParam = this.addThrice(); // ',' type identifier
                this.symbolTable.addVar(ARGUMENT, nextParam[1], nextParam[2])
            }
        }

        this.close(PARAM_LIST);
    }

    // '{' varDec* statements '}'
    compileSubroutineBody = () => {
        this.open(SUBROUTINE_BODY);

        this.addPlus(); // '{'
        while (this.is(VAR)) {
            this.compileVarDec();
            this.i++;
        }
        this.compileStatements();
        this.add(); // '}'

        this.close(SUBROUTINE_BODY);
    }

    // 'var' type identifier (',' identifier)* ';'
    compileVarDec = () => {
        this.open(VAR_DEC);

        const firstVar = this.addThrice(); // 'var' type identifier
        this.symbolTable.addVar(LOCAL, firstVar[1], firstVar[2])

        while (this.is(COMMA)) {
            const nextVar = this.addTwice(); // ',' identifier
            this.symbolTable.addVar(LOCAL, firstVar[1], nextVar[2])
        }
        this.add(); // ';'
        this.close(VAR_DEC);
    }

    // (letStatement | ifStatement | whileStatement | doStatement | returnStatement)*
    compileStatements = () => {
        this.open(STATEMENTS);

        while ([IF, LET, WHILE, DO, RETURN].includes(this.curr)) {
            if (this.is(LET)) {
                this.compileLetStatement();
            } else if (this.is(IF)) {
                this.compileIfStatement();
            } else if (this.is(WHILE)) {
                this.compileWhileStatement();
            } else if (this.is(DO)) {
                this.compileDoStatement();
            } else {
                this.compileReturnStatement();
            }
            this.i++;
        }

        this.close(STATEMENTS)
    }

    // 'let' identifier ('[' expression ']')? '=' expression ';'
    compileLetStatement = () => {
        this.open(LET_STATEMENT);

        const assignee = this.addTwice(); // 'let' identifier
        if (this.is(OPEN_BRACKET)) {
            this.vmInstructions.push('push ' + assignee[1].address) // we get the address for the start of the array's block in memory
            this.addPlus(); // '['
            this.compileExpression(); // takes care of pushing the element index
            this.addPlus() // ']'
            this.vmInstructions.push('add'); // add the index to the address and leave the address on the stack for later.
            this.addPlus(); // '='
            this.compileExpression();
            this.vmInstructions.push('pop temp 0'); // puts the result of the expression compilation in a temporary place
            this.vmInstructions.push('pop pointer 1'); // what's left on the stack points to the exact address of the current array element, so now we use the address to set THAT(pointer 1 === THAT)
            this.vmInstructions.push('push temp 0'); // gets the expression result back
            this.vmInstructions.push('pop that 0'); // Now we can store the expression in that 0, because the THAT segment starts exactly at the address of the element in the array we want to update
        } else {
            this.addPlus(); // '='
            this.compileExpression();
            this.vmInstructions.push('pop ' + this.symbolTable.getVar(assignee[1]).address)
        }
        this.add(); // ';'

        this.close(LET_STATEMENT);
    }

    // 'if' '(' expression ')' '{' statements '}' ('else' '{' statements '}')?
    compileIfStatement = () => {
        this.open(IF_STATEMENT);

        this.addTwice(); // 'if' '('
        this.compileExpression();
        this.vmInstructions.push('not');
        this.vmInstructions.push('if-goto IF_FALSE_' + this.labelCount);
        this.addTwice(); // ')' '{'
        this.compileStatements();
        this.vmInstructions.push('goto IF_END_' + this.labelCount)
        this.add(); // '}'
        this.vmInstructions.push('label IF_FALSE_' + this.labelCount);
        if (this.next === ELSE) {
            this.i++;
            this.addTwice(); // 'else' '{'
            this.compileStatements();
            this.add(); // '}'
        }
        this.vmInstructions.push('label IF_END_' + this.labelCount)
        this.labelCount++;
        this.close(IF_STATEMENT);
    }

    // 'while' '(' expression ')' '{' statements '}'
    compileWhileStatement = () => {
        this.open(WHILE_STATEMENT);

        this.addTwice(); // 'while' '('
        this.vmInstructions.push('label WHILE_' + this.labelCount)
        this.compileExpression();
        this.addTwice(); // ')' '{'
        this.vmInstructions.push('not');
        this.vmInstructions.push('if-goto WHILE_END_' + this.labelCount);
        this.compileStatements();
        this.add(); // '}'
        this.vmInstructions.push('goto WHILE_' + this.labelCount);
        this.vmInstructions.push('label WHILE_END_' + this.labelCount);
        this.labelCount++;

        this.close(WHILE_STATEMENT);
    }

    // 'do' (identifier '.')? identifier '(' expressionList ')'
    compileDoStatement = () => {
        this.open(DO_STATEMENT);

        this.addPlus(); // 'do'

        this.compileSubroutineCall();
        this.vmInstructions.push('pop temp 0') // since do statements are always void
        this.add(); // ';'
        this.close(DO_STATEMENT)
    }

    // 'return' expression? ';'
    compileReturnStatement = () => {
        this.open(RETURN_STATEMENT);

        this.addPlus(); // 'return'
        if (!this.is(SEMICOLON)) {
            this.compileExpression();
        } else {
            this.vmInstructions.push('push constant 0');
        }
        this.add(); // ';'
        this.vmInstructions.push('return')
        this.close(RETURN_STATEMENT)
    }

    // foo.bar(any number of args), Foo.bar(any number of args), bar(any number of args)
    compileSubroutineCall = () => {
        let argumentCount, functionCall;
        if (this.next === PERIOD) {
            functionCall = this.addThrice(); // identifier '.' identifier
            this.addPlus(); // '('
            const foundVar = this.symbolTable.getVar(functionCall[0]);
            if (foundVar) { // foo.bar()
                this.vmInstructions.push('push ' + foundVar.address)
                argumentCount = this.compileExpressionList(); // this should take care of pushing the arguments and returning how many there are
                this.add(); // ')'
                this.i++;
                this.vmInstructions.push('call ' + foundVar.type + functionCall[2] + ' ' + argumentCount);
            } else { // Foo.bar()
                argumentCount = this.compileExpressionList(); // this should take care of pushing the arguments and returning how many there are
                this.add(); // ')'
                // if(argumentCount > 0) { // TODO: somehow adding ++ here messes up some scenarios, but removing it messes up other scenarios
                this.i++; // TODO: with this on: Square works. SquareGame fails after line 28. Main has wrong 0 instead of 1 for function main arg count and calls to SquareGame after SquareGame.new, and missing period for SquareGame function calls after SquareGame.new
                // }
                this.vmInstructions.push('call ' + functionCall.join('') + ' ' + argumentCount);
            }
        } else { // bar()
            functionCall = this.addTwice(); // identifier '('
            this.vmInstructions.push('push pointer 0');
            argumentCount = this.compileExpressionList(); // takes care of pushing arguments

            this.addPlus(); // ')'
            this.vmInstructions.push('call ' + this.className + '.' + functionCall[0] + ' ' + Number(argumentCount + 1));
        }
    }

    // (expression (',' expression)*)?
    compileExpressionList = () => {
        this.open(EXPRESSION_LIST);
        let count = 0;

        if (!this.is(CLOSE_PAREN)) {
            this.compileExpression();
            count++;
            while (this.is(COMMA)) {
                this.addPlus(); // ','
                this.compileExpression()
                count++;
            }
        }

        this.close(EXPRESSION_LIST);
        return count;
    }

    // term (op term)*
    compileExpression = () => {
        this.open(EXPRESSION);

        this.compileTerm();
        this.i++;
        while (ops?.includes(this.curr)) {
            const op = this.addPlus(); // op
            this.compileTerm();
            this.compileOp(op)
            this.i++;
        }

        this.close(EXPRESSION);
    }

    // op
    compileOp = (op) => {
        switch (op) {
            case PLUS:
                this.vmInstructions.push('add');
                break;
            case MINUS:
                this.vmInstructions.push('sub');
                break;
            case ASTERISK:
                this.vmInstructions.push('call Math.multiply 2')
                break;
            case SLASH:
                this.vmInstructions.push('call Math.divide 2')
                break;
            case AMPERSAND:
                this.vmInstructions.push('and');
                break;
            case PIPE:
                this.vmInstructions.push('or');
                break;
            case LESS_THAN:
                this.vmInstructions.push('lt');
                break;
            case GREATER_THAN:
                this.vmInstructions.push('gt');
                break;
            case EQUALS:
                this.vmInstructions.push('eq');
                break;
        }
    }

    // integerConstant | stringConstant | keyword | identifier | identifier '['expression ']'
    // | identifier '(' expressionList ')' | identifier '.' identifier '(' expressionList ')'
    // | '(' expression ')' | ('-' | '~') term
    compileTerm = () => {
        this.open(TERM);

        if (this.isType(INT_CONST)) {
            const number = this.add();
            this.vmInstructions.push('push constant ' + Math.abs(number));
            if (number < 0) {
                this.vmInstructions.push('neg');
            }
        } else if (this.isType(STRING_CONST)) { // stringConstant
            const string = this.add();
            this.compileString(string);
        } else if (this.curr === TRUE) { // 'true'
            this.add()
            this.vmInstructions.push('push constant 0');
            this.vmInstructions.push('not');
        } else if ([FALSE, NULL]?.includes(this.curr)) { // 'false' | 'null'
            this.add();
            this.vmInstructions.push('push constant 0')
        } else if (this.curr === THIS) { // 'this'
            this.vmInstructions.push('push pointer 0')
            this.add()
        } else if (this.isType(IDENTIFIER)) {
            if (this.next === OPEN_BRACKET) {
                const arrayVar = this.addTwice(); // identifier '['
                this.vmInstructions.push('push ' + this.symbolTable.getVar(arrayVar[0]).address)
                this.compileExpression(); // takes care of pushing the array index
                this.vmInstructions.push('add')
                this.vmInstructions.push('pop pointer 1');
                this.vmInstructions.push('push that 0');
                this.add(); // ']'
            } else if ([OPEN_PAREN, PERIOD].includes(this.next)) { // identifier '(' expressionList ')' | identifier '.' identifier '(' expressionList ')'
                this.compileSubroutineCall();
            } else { // identifier
                const identifier = this.add();
                this.vmInstructions.push('push ' + this.symbolTable.getVar(identifier).address)
            }
        } else if (this.is(OPEN_PAREN)) {
            this.addPlus(); // '('
            this.compileExpression();
            this.add(); // ')'
        } else if (this.curr === MINUS) { // '-'
            this.addPlus();
            this.compileTerm();
            this.vmInstructions.push('neg')
        } else if (this.curr === TILDE) { // '~'
            this.addPlus();
            this.compileTerm();
            this.vmInstructions.push('not')
        }

        this.close(TERM);
    }

    // stringConstant
    compileString(str) {
        this.vmInstructions.push('push constant ' + str.length)
        this.vmInstructions.push('call String.new 1')
        for (let i = 0; i < str.length; i++) {
            this.vmInstructions.push('push constant ' + str.toUpperCase().charCodeAt(i))
            this.vmInstructions.push('call String.appendChar 2')
        }
    }
}

new JackCompiler();

