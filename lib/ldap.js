require('dotenv').config()
const {
    LDAP_HOST,
    LDAP_PERMISSION
} = process.env
const ldap = require('ldapjs')

const connect = () => {
  const client = ldap.createClient({
      url: `ldap://${LDAP_HOST}`
  })
  return client
}

// // READ THIS: https://developer.ibm.com/tutorials/se-use-ldap-authentication-authorization-nodejs-cloud-application/
// Client events
// error	General error
// connectRefused	Server refused connection. Most likely bad authentication
// connectTimeout	Server timeout
// connectError	Socket connection error
// setupError	Setup error after successful connection
// socketTimeout	Socket timeout
// resultError	Search result error
// timeout	Search result timeout
// destroy	After client is disconnected
// end	Socket end event
// close	Socket closed
// connect	Client connected
// idle	Idle timeout reached
// client.on('connectError', (err) => {
//     console.error('Socket connection error')
//   })

// client.on('connectRefused', (err) => {
//     console.error('Server refused connection. Most likely bad authentication')
// })
// client.on('connectTimeout', (err) => {
//     console.error('Server timeout')
// })
// client.on('connect', (err) => {
//     console.log('Connected to LDAP')
// })

const searchUserDetails = (client, user, callback) => {
  return new Promise((resolve, reject) => {
    const opts = {
        filter: `(&(sAMAccountName=${user}))`, 
        scope: 'sub',
      }
    
    const search = 'OU=Users,OU=Zwijndrecht,DC=ffem,DC=fujifilm-ffem,DC=com'

    client.search(search, opts, (err, res) => {
      if (err) {
          console.log(err)
      }
      // res.on('searchRequest', (searchRequest) => {
      //   // console.log('searchRequest: ', searchRequest);
      // })
      res.on('searchEntry', (entry) => {
        entry.pojo['attributes'].find(attribute => {
          if (attribute.type === 'cn') {
            const cn = attribute.values[0]
            resolve(callback(client, cn))
          }
        })
      })
      res.on('searchReference', (referral) => {
        console.log('referral: ' + referral.uris.join());
      })
      res.on('error', (err) => {
        reject(err.message)
        // console.error('error: ' + err.message);
      })
      // res.on('end', (result) => {
      //   console.log('status: ' + result.status);
      // })
    })

  })
}

const clientCheckPermission = (client, group, cn) => {
  return new Promise((resolve, reject) => {
    const opts = {
        scope: 'sub'
      }
    client.search(group, opts, (err, res) => {
      if (err) {
          console.log(err)
      }
      // res.on('searchRequest', (searchRequest) => {
      //   // console.log('searchRequest: ', searchRequest);
      // })
      res.on('searchEntry', (entry) => {
        entry.pojo['attributes'].find(attribute => {
          if (attribute.type === 'member') {
            attribute.values.find(member => {
              if (cn = member.split(',')[0].replace('CN=', '')) {
                resolve()
                console.log('Authenticated')
              }
            })
          }
        })
      })
      res.on('searchReference', (referral) => {
        console.log('referral: ' + referral.uris.join());
      })
      res.on('error', (err) => {
        console.error('error: ' + err.message)
        reject(err.message)
      })
      res.on('end', (result) => {
        console.log('status: ' + result.status)
        reject('No match')
      })
    })
  })
}

const rootLogin = () => {
  bind(LDAP_USER, LDAP_PASSWD);
}

const checkPermission = (client, cn) => {
  const permission = LDAP_PERMISSION
  return clientCheckPermission(client, permission, cn)
}

const loginUser = (user, password) => {
  return bind(user, password)
}

const bind = (user, password) => {
  const client = connect()
  return new Promise((resolve, reject) => {
    try {
      client.bind(`FFEM\\${user}`, password, (err, res) => {
          // assert.ifError(err);
          if (err) {
            reject(err)
            return
          }
          if (res) {
            console.log('User bound')
            searchUserDetails(client, user, checkPermission).then(() => {
              client.destroy()
              console.log('success')
              resolve()
            }).catch((err) => {
              client.destroy()
              reject('user not found in group')
            })
          }
        })
    }
    catch (err) {
      reject(err)
    }

  })
}

// const search = (searchOptions) => {
//   ldapClient.search(ldapBaseDN, searchOptions, (err, searchResult) => {
//     if (err) return done(err);
//     let user = null;
//     searchResult.on('searchEntry', (entry) => {
//       user = entry.object;
//     });
//     searchResult.on('end', () => {
//       if (!user) return done(null, false, { message: 'Invalid credentials' });
//       ldapClient.bind(user.dn, password, (err) => {
//         if (err) return done(null, false, { message: 'Invalid credentials' });
//         return done(null, user);
//       });
//     });
//   });
// }

module.exports = {
  connect,
  rootLogin,
  loginUser,
  clientCheckPermission
}