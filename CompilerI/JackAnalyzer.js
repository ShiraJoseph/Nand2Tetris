const fs = require('fs');
let currIndent;

/**
 * Code element class with value and type
 */
class Token {
  value;
  type;
  indents;

  constructor (value, type) {
    this.value = value;
    this.type = type;
    if (!this.type) {
      this.type = this.getType();
    }
  }

  /**
   * returns the xml element as it should be written to the file, with start and/or end tags
   * @returns {string}
   */
  get wrapped () {
    const indent = this.determineIndent();

    if (this.value === START_TAG) {
      return indent + this.startWrap(this.type);
    }
    if (this.value === END_TAG) {
      return indent + this.endWrap(this.type);
    }
    if (symbols.find(symbol => this.value === symbol)) {
      this.value = this.encodeSymbol(this.value)
    }
    return indent + this.wrap(this.value, this.type);
  }

  /**
   * Assigns the number of tabs to insert at the start of the current xml line
   * @returns {string}
   */
  determineIndent () {
    if (currIndent == null) {
      currIndent = 0;
    }
    if (this.value === START_TAG) {
      this.indents = String(currIndent);
      currIndent++;

    } else if (this.value === END_TAG) {
      currIndent--;
      this.indents = String(currIndent);

    } else {
      this.indents = String(currIndent);
    }

    return '  '.repeat(this.indents);
  }

  wrap = (text, label) => `${this.startWrap(label)} ${text} ${this.endWrap(label)}`;

  startWrap = label => `<${label}>`;

  endWrap = label => `</${label}>`;

  /**
   * Returns whether the current token is a keyword, symbol, integerConst, stringConst, or identifier
   * @returns {string}
   */
  getType() {
    if (keywords?.find(keyword => this.value === keyword)) {
      return KEYWORD;
    }

    if (symbols?.find(symbol => this.value === symbol)) {
      return SYMBOL;
    }

    if (String(Number(this.value)) === this.value) {
      return INT_CONST;
    }
    if (this.value.startsWith(`"`)) {
      this.value = this.value.replace(/\"/g, '');

      return STRING_CONST;
    }

    return IDENTIFIER;
  }

  /**
   * Encodes special symbols
   * @param symbol
   * @returns {string|*}
   */
  encodeSymbol (symbol) {
    switch (symbol) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case '&':
        return '&amp;'
      default:
        return symbol
    }
  }
}

/**
 * Main Analyzer class
 */
class JackAnalyzer {
  i;
  typedTokens;
  xmlElements;

  // region Helpers

  get curr () {
    return this.typedTokens?.[this.i]?.value;
  }

  get next () {
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
  add = () => this.xmlElements?.push(this.typedTokens?.[this.i])

  /** Add token and advance */
  addPlus = () => {
    this.add();
    this.i++;
  }

  /** Add two tokens and advance */
  addTwice = () => {
    this.addPlus();
    this.addPlus();
  }

  /** Add three tokens and advance */
  addThrice = () => {
    this.addTwice()
    this.addPlus();
  }

  // endregion

  constructor () {
    this.init();
  }

  /**
   * Initializes the file(s) for analysis
   */
  init () {
    const args = process.argv.slice(2);
    const inputPath = args[0];

    fs.stat(inputPath, (err, stats) => {
      stats.isDirectory() && fs.readdir(inputPath, (err, files) => {
        files.forEach((filename) => {
          filename.endsWith('.jack') && (() => {
            const inputFilePath = inputPath +'/'+ filename;
            this.createXML(inputFilePath);
          })();
        });
      });

      stats.isFile() && inputPath.endsWith('.jack') && (() => {
        this.createXML(inputPath);
      })();
    });
  }

  /**
   * Reads a single jack file and writes the compilation result in an xml file
   * @param inputFilePath
   */
  createXML (inputFilePath) {
    const outputFilePath = inputFilePath.replace('jack', 'xml');
    fs.readFile(inputFilePath, 'utf8', (err, data) => {
      fs.writeFile(outputFilePath, this.compile(data), (err) => {
      });
    });
  }

  /**
   * Compiles the lines of jack code into lines of xml code
   * @param data
   * @returns {string}
   */
  compile (data) {
    this.i = 0;
    this.xmlElements = [];
    this.typedTokens = this.tokenize(data);
    
    this.compileClass();

    return this.xmlElements?.map(token => token?.wrapped)?.join('\n');
  }

  /**
   * Splits up the jack file content by line into Tokens, each with a value and type
   */
  tokenize (data) {
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
    this.open(CLASS);

    this.addThrice(); // 'class' identifier '{'
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

    this.addThrice(); // ('static' | 'field') type identifier
    while (this.is(COMMA)) {
      this.addTwice(); // ',' identifier
    }
    this.add(); // ';'
    this.close(CLASS_VAR_DEC);
  }

  // ('constructor' | 'function' | 'method') type identifier '(' parameterList ')' subroutineBody
  compileSubroutineDec = () => {
    this.open(SUBROUTINE_DEC);

    this.addTwice(); // ('constructor' | 'function' | 'method') type
    this.addTwice(); // identifier (
    this.compileParameterList();
    this.addPlus(); // )
    this.compileSubroutineBody();
    this.i++;

    this.close(SUBROUTINE_DEC);
  }

  // (type identifier (',' type identifier)*)?
  compileParameterList = () => {
    this.open(PARAM_LIST);

    if (!this.is(CLOSE_PAREN)) {
      this.addTwice(); // type identifier
      while (this.is(COMMA)) {
        this.addThrice(); // ',' type identifier
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

    this.addThrice(); // 'var' type identifier
    while (this.is(COMMA)) {
      this.addTwice(); // ',' identifier
    }
    this.add(); // ;

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

    this.addTwice(); // 'let' identifier
    if (this.is(OPEN_BRACKET)) {
      this.addPlus(); // '['
      this.compileExpression();
      this.addPlus() // ']'
    }
    this.addPlus(); // '='
    this.compileExpression();
    this.add(); // ';'

    this.close(LET_STATEMENT);
  }

  // 'if' '(' expression ')' '{' statements '}' ('else' '{' statements '}')?
  compileIfStatement = () => {
    this.open(IF_STATEMENT);

    this.addTwice(); // 'if' '('
    this.compileExpression();
    this.addTwice(); // ')' '{'
    this.compileStatements();
    this.add(); // }
    if (this.next === ELSE) {
      this.i++;
      this.addTwice(); // 'else' '{'
      this.compileStatements();
      this.add(); // '}'
    }

    this.close(IF_STATEMENT);
  }

  // 'while' '(' expression ')' '{' statements '}'
  compileWhileStatement = () => {
    this.open(WHILE_STATEMENT);

    this.addTwice(); // 'while' '('
    this.compileExpression();
    this.addTwice(); // ')' '{'
    this.compileStatements();
    this.add(); // '}'

    this.close(WHILE_STATEMENT);
  }

  // 'do' (identifier '.')? identifier '(' expressionList ')'
  compileDoStatement = () => {
    this.open(DO_STATEMENT);

    this.addPlus(); // 'do'
    if (this.next === PERIOD) {
      this.addThrice(); // identifier '.' identifier
      this.addPlus(); // '('
      this.compileExpressionList();
      this.add(); // ')'
      this.i++;
    } else {
      this.addTwice(); // identifier '('
      this.compileExpressionList();
      this.addPlus(); // ')'
    }
    this.add(); // ';'

    this.close(DO_STATEMENT)
  }

  // 'return' expression? ';'
  compileReturnStatement = () => {
    this.open(RETURN_STATEMENT);

    this.addPlus(); // 'return'
    if (!this.is(SEMICOLON)) {
      this.compileExpression();
    }
    this.add(); // ';'

    this.close(RETURN_STATEMENT)
  }

  // (expression (',' expression)*)?
  compileExpressionList = () => {
    this.open(EXPRESSION_LIST);

    if (!this.is(CLOSE_PAREN)) {
      this.compileExpression();
      while (this.is(COMMA)) {
        this.addPlus(); // ','
        this.compileExpression()
      }
    }

    this.close(EXPRESSION_LIST);
  }

  // term (op term)*
  compileExpression = () => {
    this.open(EXPRESSION);

    this.compileTerm();
    this.i++;
    while (ops?.includes(this.curr)) {
      this.addPlus(); // op
      this.compileTerm();
      this.i++;
    }

    this.close(EXPRESSION);
  }

  // integerConstant | stringConstant | keyword | identifier | identifier '['expression ']'
  // | identifier '(' expressionList ')' | identifier '.' identifier '(' expressionList ')'
  // | '(' expression ')' | ('-' | '~') term
  compileTerm = () => {
    this.open(TERM);

    if (this.isType(INT_CONST) || this.isType(STRING_CONST) || [TRUE, FALSE, NULL, THIS]?.includes(this.curr)) {
      this.add(); // integerConstant | stringConstant | 'true' | 'false' | 'null' | 'this'
    } else if (this.isType(IDENTIFIER)) {
      if (this.next === OPEN_BRACKET) {
        this.addTwice(); // identifier '['
        this.compileExpression();
      } else if (this.next === OPEN_PAREN) {
        this.addTwice(); // identifier '('
        this.compileExpressionList();
      } else if (this.next === PERIOD) {
        this.addThrice(); // identifier '.' identifier
        this.addPlus(); // '('
        this.compileExpressionList();
      }
      this.add(); // identifier | ')' | ']'
    } else if (this.is(OPEN_PAREN)) {
      this.addPlus(); // '('
      this.compileExpression();
      this.add(); // ')'
    } else if ([MINUS, TILDE].includes(this.curr)) {
      this.addPlus(); // '-' | '~'
      this.compileTerm();
    }

    this.close(TERM);
  }
}

// region Consts

const CLASS = 'class';
const CONSTRUCTOR = 'constructor';
const FUNCTION = 'function';
const METHOD = 'method';
const VAR = 'var';
const FIELD = 'field';
const STATIC = 'static';
const INT = 'int';
const CHAR = 'char';
const BOOLEAN = 'boolean';
const VOID = 'void';
const TRUE = 'true';
const FALSE = 'false';
const NULL = 'null';
const THIS = 'this';
const LET = 'let';
const DO = 'do';
const IF = 'if';
const ELSE = 'else';
const WHILE = 'while';
const RETURN = 'return';
const OPEN_CURLY = '{';
const CLOSE_CURLY = '}';
const OPEN_PAREN = '(';
const CLOSE_PAREN = ')';
const OPEN_BRACKET = '[';
const CLOSE_BRACKET = ']';
const PERIOD = '.';
const COMMA = ',';
const SEMICOLON = ';';
const PLUS = '+';
const MINUS = '-';
const ASTERISK = '*';
const SLASH = '/';
const AMPERSAND = '&';
const PIPE = '|';
const LESS_THAN = '<';
const GREATER_THAN = '>';
const EQUALS = '=';
const TILDE = '~';
const KEYWORD = 'keyword';
const SYMBOL = 'symbol';
const INT_CONST = 'integerConstant';
const STRING_CONST = 'stringConstant';
const IDENTIFIER = 'identifier';
const SUBROUTINE_DEC = 'subroutineDec';
const PARAM_LIST = 'parameterList';
const SUBROUTINE_BODY = 'subroutineBody';
const VAR_DEC = 'varDec';
const CLASS_VAR_DEC = 'classVarDec';
const STATEMENTS = 'statements';
const LET_STATEMENT = 'letStatement';
const EXPRESSION = 'expression';
const TERM = 'term';
const EXPRESSION_LIST = 'expressionList';
const IF_STATEMENT = 'ifStatement';
const WHILE_STATEMENT = 'whileStatement';
const DO_STATEMENT = 'doStatement';
const RETURN_STATEMENT = 'returnStatement';
const START_TAG = 'startTag';
const END_TAG = 'endTag';

const keywords = [CLASS, CONSTRUCTOR, FUNCTION, METHOD, VAR, FIELD, STATIC, INT, CHAR, BOOLEAN, VOID, TRUE, FALSE, NULL,
  THIS, LET, DO, IF, ELSE, WHILE, RETURN];
const symbols = [OPEN_CURLY, CLOSE_CURLY, OPEN_PAREN, CLOSE_PAREN, OPEN_BRACKET, CLOSE_BRACKET, PERIOD, COMMA,
  SEMICOLON, PLUS, MINUS, ASTERISK, SLASH, AMPERSAND, PIPE, LESS_THAN, GREATER_THAN, EQUALS, TILDE];
const ops = [PLUS, MINUS, ASTERISK, SLASH, AMPERSAND, PIPE, LESS_THAN, GREATER_THAN, EQUALS]

// endregion

new JackAnalyzer();
