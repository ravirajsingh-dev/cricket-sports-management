module.exports = {
  successResponse: (
    res,
    data = {},
    message = "",
    statusCode = 200,
    status = true,
  ) => {
    return res
      .status(statusCode)
      .json({ status: status, message: message, response: data });
  },

  /**
   * Unified error envelope for all API failures (including auth).
   * Shape: { status, message, errors[], tokenStatus? }
   */
  errorResponse: (
    res,
    error = "",
    message = "Errors! Please correct the following errors and submit again.",
    statusCode = 400,
    status = false,
  ) => {
    let errorsArray = [];
    let tokenStatus;

    if (Array.isArray(error)) {
      errorsArray = error;
      const withToken = error.find(
        (item) => item && typeof item === "object" && "tokenStatus" in item,
      );
      if (withToken) tokenStatus = withToken.tokenStatus;
    } else if (error && typeof error === "object") {
      const { tokenStatus: ts, ...rest } = error;
      if (ts !== undefined) tokenStatus = ts;
      errorsArray = [Object.keys(rest).length ? rest : { msg: message }];
    } else if (error) {
      errorsArray = [{ msg: String(error) }];
    }

    const payload = {
      status,
      message,
      errors: errorsArray,
      // Back-compat for clients that still read `msg`
      msg: message,
    };
    if (tokenStatus !== undefined) {
      payload.tokenStatus = tokenStatus;
    }

    return res.status(statusCode).json(payload);
  },
};
