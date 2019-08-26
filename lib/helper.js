let responseObj = (data, statusCode) => {
  return {
    statusCode: statusCode,
    headers: {
      "x-custom-header": ""
    },
    body: JSON.stringify(data)
  };
};

module.exports = {
  responseObj
};
