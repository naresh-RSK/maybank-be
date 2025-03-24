const removeNullProperties = (obj) => {
    Object.keys(obj).forEach(key => {
      if (obj[key] === null) {
        delete obj[key];
      }
      if(key === "START_DATE" || key === "CREATE_DATE" || key === "MODIFY_DATE"){
        obj[key] = (obj[key]).toISOString().split('T')[0]
      }
    });
    return obj;
  };
  
  // Export the function
  module.exports = removeNullProperties;