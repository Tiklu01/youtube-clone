// This line is like saying, "Let's create a blueprint for a special kind of response object called ApiResponse."
class ApiResponse {
    // This line is like setting up the ingredients or instructions needed to build an ApiResponse object.
    // We're specifying what pieces of information it will hold.
    constructor(
      statusCode,  // This piece holds a number like a 200 (success) or 404 (not found) to tell the outcome.
      data,        // This piece holds the actual data you want to send back, like search results or user information.
      message = "Success"  // This piece holds a message to describe the outcome, but it defaults to "Success" if not given.
    ) {
      // Assigning the provided values to the corresponding parts of our ApiResponse object.
      this.statusCode = statusCode;
      this.data = data; //data is the actual data that we want to send back like search results or user information
      this.message = message;
  
      // This line is like checking a condition to see if things went well (success).
      // If the status code is less than 400 (which usually means an error), then we set success to true, otherwise it's false.
      this.success = statusCode < 400;
    }
  }
  
  // This line is like putting a label on the box of our new ApiResponse blocks, so anyone who uses them knows what they are.
  export { ApiResponse };