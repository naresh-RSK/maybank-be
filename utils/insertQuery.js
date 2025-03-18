
const insertQuery =(data, tableName)=>{
    //const date ="2024-03-24"
    const keys = Object.keys(data)
    const requestKeys = keys.join(',')
    const values = Object.keys(data).map(key => data[key]);
    const requestValues = values.map(item =>`'${item}'`).join(", ")
    console.log(data, "data")
    console.log(`INSERT INTO ${tableName} (${requestKeys}) VALUES (${requestValues})`)
    return `INSERT INTO ${tableName} (${requestKeys}) VALUES (${requestValues})`
}
function convertDatesInObject(obj) {
    // Iterate over the object properties
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
          let str = value;
          console.log(typeof str,"str")
            // Check if the value is a Date object
            if (typeof str == 'object') {
                console.log("hqiii")
                // Convert Date to 'YYYY-MM-DD' format
                value = value.toISOString().split('T')[0];
            }
            // Return the key-value pair
            return [key, value];
        })
    );
}
const updateQuery = (data, tableName, compareValue, compareId) => {
    const keys = Object.keys(data);
    const updateString = keys.map(key => `${key} = '${data[key]}'`).join(', ');
    console.log(data, "data");
    console.log(`UPDATE ${tableName} SET ${updateString} WHERE ${compareValue} = ${compareId}`);
    return `UPDATE ${tableName} SET ${updateString} WHERE ${compareValue} = ${compareId}`;
};
module.exports = {insertQuery, convertDatesInObject, updateQuery};