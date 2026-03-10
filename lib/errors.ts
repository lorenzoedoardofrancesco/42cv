export class FTAccountNotLinked extends Error {
  constructor() {
    super();
    this.name = "FTAccountNotLinked";
    this.message = "42School Account Not Linked";
  }
}
