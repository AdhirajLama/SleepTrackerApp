import React, { createContext, Component } from 'react';
import axios from 'axios';

export const SleepContext = createContext();

export class SleepProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sleeps: []
    };
  }

  componentDidMount() {
    this.fetchSleeps();
  }

  fetchSleeps = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sleeps/sleepdata');
      this.setState({ sleeps: response.data });
    } catch (error) {
      console.error('Error fetching sleep data:', error);
    }
  };

  setSleeps = (sleeps) => {
    this.setState({ sleeps });
  };

  render() {
    return (
      <SleepContext.Provider value={{ sleeps: this.state.sleeps, setSleeps: this.setSleeps }}>
        {this.props.children}
      </SleepContext.Provider>
    );
  }
}
