import {
  SYMBOL,
  IDENTIFIER,
  INT_CONST,
  KEYWORD,
  keywords,
  START_TAG,
  STRING_CONST,
  symbols, END_TAG
} from "./constants.js";
let currIndent;
/**
 * Code element class with value and type
 */
export default class Token {
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
  getType () {
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

