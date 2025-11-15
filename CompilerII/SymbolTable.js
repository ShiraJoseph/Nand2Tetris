import {ARGUMENT, FIELD, LOCAL, STATIC, THIS} from "./constants.js";

import {Variable} from "./Variable.js";

export class SymbolTable {
  classVars = [];
  staticCount = 0;
  fieldCount = 0;
  routineVars = [];
  argCount = 0;
  localCount = 0;

  /**
   * To be called at the end of every class; clears out the class-level symbol table
   */
  resetClassVars () {
    this.classVars = [];
    this.staticCount = 0;
    this.fieldCount = 0;
  }

  /**
   * To be called at the end of every subroutine; clears out the subroutine-level symbol table
   */
  resetRoutineVars () {
    this.routineVars = [];
    this.argCount = 0;
    this.localCount = 0
  }

  /** Adds a new Variable to the class- or subroutine-level symbol table
   * @param segment - field/static/argument/local
   * @param type - int/char/boolean/<className>
   * @param name - the variable name
   */
  addVar (segment, type, name) {
    if (!this.getVar(name)) {
      switch (segment) {
        case FIELD:
          this.classVars.push(new Variable(name, type, THIS, this.fieldCount))
          this.fieldCount++;
          break;
        case STATIC:
          this.classVars.push(new Variable(name, type, segment, this.staticCount))
          this.staticCount++;
          break;
        case ARGUMENT:
          this.routineVars.push(new Variable(name, type, segment, this.argCount))
          this.argCount++;
          break;
        case LOCAL:
          this.routineVars.push(new Variable(name, type, segment, this.localCount))
          this.localCount++;
          break;
      }
    }
  }

  /**
   * Finds the Variable of the given type and name in the symbol tables
   * @param name
   * @returns {*}
   */
  getVar (name) {
    return this.routineVars.find(variable => variable.name === name) || this.classVars.find(variable => variable.name === name);
  }

  /**
   * To be called at the start of every method; "THIS" must be saved as argument 0
   * @param type
   */
  setContext (type) {
    if (this.routineVars.length === 0) {
      this.addVar(ARGUMENT, type, THIS);
    }
  }
}
