import React from 'react'
import ReactDOM from 'react-dom'

const e = React.createElement
const { ipcRenderer } = window.require('electron')

class NameForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      last_checked_email: false,
      email: '',
      lastpass: {},
      oidc: {},
      login_link: false,
      company_id: false,
      id_token: false,
      k2: false,
      fragment_id: false,
      stage: 0
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)

    ipcRenderer.on('get-stage', (event, data) => {
      console.log(`Received stage ${data} from main process`)
      this.setState({ stage: data })
    })

    ipcRenderer.on('get-email', (event, data) => {
      console.log(`Received ${data} from main process`)
      if (data) {
        this.setState({ email: data })
      }
    })
    /*
    ipcRenderer.on('get-company-id', (event, data) => {
      this.setState({ company_id: data })
      this.getK2()
    })

    ipcRenderer.on('get-id-token', (event, data) => {
      this.setState({ id_token: data })
      this.getK2()
    })
    */
    ipcRenderer.on('query-email', (event, data) => {
      this.setState({ lastpass: data })
      if (this.state.lastpass.type > 0) {
        this.beginLogin()
      }
    })

    ipcRenderer.on('query-oidc', (event, data) => {
      this.setState({ oidc: data })
      this.continueLogin()
    })
  }

  createUUID () {
    let dt = new Date().getTime()
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (dt + Math.random() * 16) % 16 | 0
      dt = Math.floor(dt / 16)
      return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16)
    })
  }

  random () {
    return this.createUUID().replace(/-/g, '')
  }

  continueLogin () {
    const redirectUri = 'https://accounts.lastpass.com/federated/oidcredirect.html'
    const clientId = this.state.lastpass.OpenIDConnectClientId
    const responseType = 'id_token token'
    const scope = 'openid email profile'
    const state = this.random() // can't find where the real state comes from
    const nonce = this.random()
    const loginHint = this.state.email.split('@')[0]
    const loginUrl = this.state.oidc.authorization_endpoint +
        '?client_id=' + clientId +
        '&redirect_uri=' + redirectUri +
        '&response_type=' + responseType +
        '&scope=' + scope +
        '&state=' + state +
        '&nonce=' + nonce +
        '&login_hint=' + loginHint
    this.setState({ login_link: loginUrl })
  }

  async beginLogin () {
    if (this.state.lastpass.type === 3) {
      console.log('company_id=' + this.state.lastpass.CompanyId)
      ipcRenderer.send('company-id', this.state.lastpass.CompanyId)
      ipcRenderer.send('query-oidc', this.state.lastpass.OpenIDConnectAuthority)
    } else {
      alert('Only oauth accounts are supported')
    }
  }

  async checkLogin (email) {
    const regex = /^.+@.+\..+$/
    // see if the email is a federated login
    if (regex.test(email)) {
      if (this.state.last_checked_email !== email) {
        this.setState({ last_checked_email: email })

        ipcRenderer.send('query-email', email)
      }
    }
  }

  getK2 (_event) {
    if (this.state.company_id && this.state.id_token) {
      console.log('getting k2')
    } else {
      console.log('Not ready to get k2')
    }
  }

  handleChange (event) {
    this.setState({ email: event.target.value })
    this.checkLogin(event.target.value)
  }

  handleSubmit (event) {
    this.checkLogin(this.state.email)
    event.preventDefault()
  }

  render () {
    if (this.state.stage === 0) {
      ipcRenderer.send('get-email')
      ipcRenderer.send('get-stage')

      return (<p>Starting...</p>)
    } else if (this.state.stage === 1) {
      if (this.state.email && !this.state.login_link) {
        this.checkLogin(this.state.email)
      }
      if (this.state.login_link) {
        return (
            <a href={this.state.login_link}>Continue to Okta</a>
        )
      } else {
        return (
            <form onSubmit={this.handleSubmit}>
              <label>
                Email address:
                <input type="text" value={this.state.email} onChange={this.handleChange}/>
              </label>
            </form>
        )
      }
    } else if (this.state.stage === 2) {
      return (<p>Finishing...</p>)
    } else if (this.state.stage === 3) {
      return (<p>Done...</p>)
    } else {
      return (<p>Stage {this.state.stage} NYI</p>)
    }
  }
}

const domContainer = document.querySelector('#root')
ReactDOM.render(e(NameForm), domContainer)
