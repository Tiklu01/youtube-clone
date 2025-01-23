// This is a special helper called 'asyncHandler'. 
// It helps us write code that can wait for things to happen (like waiting for a website to load). 
// (Technically, it's a higher-order function that creates an asynchronous middleware.)
const asyncHandler = (func) => async (req, res, next) => { 
    // Imagine this as a protective bubble for our code. 
    // (Technically, this is a try-catch block, which handles potential exceptions.)
    try {
      // Inside the bubble, we try to run the code you gave us ('func').
      // 'await' is like pausing the code until 'func' finishes its work. 
      // (Technically, 'await' is used with asynchronous functions to wait for their resolution.)
      await func(req, res, next); 
    } catch (error) {
      // If something goes wrong inside the bubble (like a boo-boo), we catch it here!
      // We send a message back saying "Oops, something went wrong!" 
      // 'res.status' sets the code for the message (like "404 Not Found" or "500 Server Error").
      // (Technically, 'res.status' sets the HTTP status code of the response.)
      res.status(error.status || 500) 
        .json({ 
          success: false, // Tell the computer that something went wrong.
          message: error.message // Send a message explaining the boo-boo. 
          // (Technically, this sends a JSON response with the error message.)
        });
    }
  };