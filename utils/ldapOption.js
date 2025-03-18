const ldap = require('ldapjs');
const passport = require('passport');
const LdapStrategy = require('passport-ldapauth').Strategy;
 
// LDAP server details
const ldapConfig =(user)=>{

  const ldapOptions = {
    server: {
      url: 'ldap://10.4.71.50:389',
      bindDN: 'cn=admin,dc=example,dc=com', // Admin DN
      bindCredentials: 'Password1',
      searchBase: 'DC=mbb,DC=com,DC=sg', // Base DN
      searchFilter: `(uid={{username}})`, // Filter to find users by username
      tlsOptions: { rejectUnauthorized: false } // Optional for LDAPS
    }
  }

}