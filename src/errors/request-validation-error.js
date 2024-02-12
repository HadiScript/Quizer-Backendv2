const { CustomError } = require('./custom-error');

class RequestValidationError extends CustomError {
  constructor(errors) {
    super('Invalid request parameters');
    this.statusCode = 400;
    this.errors = errors;

    // Only because we are extending a built-in class
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    return this.errors.map((err) => {
      if (err.type === 'field') {
        return { message: err.msg, field: err.path };
      }
      return { message: err.msg };
    });
  }
}

module.exports = { RequestValidationError };