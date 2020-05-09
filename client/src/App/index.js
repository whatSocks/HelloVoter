import React, { Component } from "react";
import { ActivityIndicator, Linking, Platform, Text, TouchableOpacity } from "react-native";
import SideMenu from 'react-native-side-menu';
import jwt_decode from 'jwt-decode';

import { LoginScreen, Canvassing, Dashboard, MainMenu, NoMatch } from '../screens';
import { Router, Switch, Route, Link, SafariView } from './routing';
import { Root, Content, Space, ViewCenter } from '../components/Layout';
import * as storage from '../lib/storage';
import { colors } from '../colors';

class App extends Component {

  constructor() {
    super();

    this.state = {
      loading: true,
      token: null,
      user: null,
      menuOpen: false,
    };
  }

  componentDidMount = async () => {
    let token;

    if (Platform.OS === 'web') {
      try {
        if (window.location.href.match(/\/jwt\//)) {
          token = window.location.href.split('/').pop();
          console.log('got token: ', token);
          if (token) {
            await this.setToken(token);
            setTimeout(() => {window.location.href = '/hellovoter/#/'}, 500);
            setTimeout(() => {window.location.reload()}, 1500);
            return;
          }
        }
      } catch(e) {
        console.warn(e);
      }
    } else {
      // Add event listener to handle OAuthLogin:// URLs
      Linking.addEventListener('url', this.handleOpenURL);
      // Launched from an external URL
      Linking.getInitialURL().then((url) => {
        if (url) this.handleOpenURL({ url });
      });
    }

    token = await storage.get('jwt');

    if (token) this.setToken(token);

    this.setState({loading: false});
  }

  logout = async () => {
    storage.del('jwt');
    this.setState({user: null, menuOpen: false});
  }

  setToken = async (token) => {
    try {
      let user = jwt_decode(token);
      await storage.set('jwt', token);
      this.setState({token, user});
    } catch (e) {
      storage.del('jwt');
    }
  }

  handleOpenURL = async ({ url }) => {
    // Extract jwt token out of the URL
    const m = url.match(/jwt=([^#]+)/);

    if (m) this.setToken(m[1]);

    if (Platform.OS === 'ios') {
      SafariView.dismiss();
    }

    this.setState({loading: false});
  }

  render() {
    const { loading, menuOpen, user } = this.state;

    const menu = (<MainMenu refer={this} />);

    if (loading) return (
      <Root>
        <Content>
          <ViewCenter>
            <Text>Loading HelloVoter...</Text>
            <Space />
            <ActivityIndicator size="large" />
          </ViewCenter>
        </Content>
      </Root>
    );
    if (!user) return (<Router><Route path="/" render={() => <LoginScreen refer={this} />} /></Router>);

    return (
      <Router>
        <SideMenu menu={menu} openMenuOffset={200} isOpen={menuOpen} bounceBackOnOverdraw={false}>
        <Root>
          <Content>
            <TouchableOpacity onPress={() => this.setState({menuOpen: true})}>
              <Text>MENU</Text>
            </TouchableOpacity>
              <Switch>
                <Route exact={true} path="/" render={() => <Dashboard refer={this} />} />
                <Route path="/canvassing" render={() => <Canvassing refer={this} />} />
                <Route component={NoMatch} />
              </Switch>
            </Content>
          </Root>
        </SideMenu>
      </Router>
    );
  }
}

export default App;