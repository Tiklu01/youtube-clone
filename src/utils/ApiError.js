// Imagine we're creating a special kind of error message, just for our program, like a special type of Lego block.
// We're calling this special block "ApiError" (API stands for Application Programming Interface, a fancy way to talk to other programs).
// This line is like saying, "Let's build a new kind of error block called ApiError."
class ApiError extends Error {
  // This line is like putting together the basic pieces of our ApiError block.
  // We're saying that ApiError is a more specific kind of error, inheriting all the powers of a regular Error block (like having a message).
  constructor(
    statusCode, // This piece holds a number like a 404 (not found) or 500 (server error) to tell what went wrong.
    message = "Something went wrong", // This piece holds the main error message, like "Uh oh, we can't find your cat picture!"
    errors = [], // This piece can hold a list of smaller errors, like if multiple things went wrong at once.
    stack = ""  // This piece can hold extra information about where the error happened in your code, like a detective's notes!
  ) {
    // This line is like calling the "super constructor" - it's like asking the regular Error block to build its parts first, following its own instructions.
    super(message);

    // Now that we have the basic error block built, let's add our special ApiError features!
    this.statusCode = statusCode;  // Assigning the status code number to our ApiError block.
    this.data = null;  // This space can hold extra data if needed, but we'll leave it empty for now.
    this.message = message;  // Assigning the main error message to our ApiError block.
    this.success = false;  // Since it's an error, we'll set this to "false" to show things didn't go as planned.
    this.errors = errors;  // Assigning the list of smaller errors to our ApiError block.

    // This part is like adding a special label to our block if we have extra information (the detective's notes).
    if (stack) {
      this.stack = stack;
    } else {
      // If we don't have extra information, we can still add a label using a special function.
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// This line is like putting a label on the box of our new ApiError blocks, so anyone who uses them knows what they are.
export { ApiError };