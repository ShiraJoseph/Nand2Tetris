export class Variable {
  name;
  type;
  segment;
  index;

  constructor (name, type, segment, index) {
    this.name = name;
    this.type = type;
    this.segment = segment;
    this.index = index;
  }

  get address () {
    // console.log(this.name + ' is at ' + `${this.segment} ${this.index}`)
    return `${this.segment} ${this.index}`;
  }
}
