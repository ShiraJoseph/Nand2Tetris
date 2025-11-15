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
    return `${this.segment} ${this.index}`;
  }
}
