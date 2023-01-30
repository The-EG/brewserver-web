'use strict';

class BrewserverPage extends React.Component {
    constructor(props) {
        super(props);
        this.socket = undefined;
    }

    componentWillMount() {
        this.socket = new WebSocket(`ws://${window.location.host}/api/websocket`);
    }

    render() {
        return [
            React.createElement(BrewserverNavBar, {}),
            React.createElement(SocketErrorAlert, {socket: this.socket}),
            React.createElement('div', {className:'container py-1'}, [
                React.createElement('div', {className: 'row justify-content-lg-center py-1'}, [
                    React.createElement('div', {className: 'col col-md-4 col-sm-5 col-lg-2 col-xl-2 py-1'}, [
                        React.createElement(TemperaturesCard, {socket: this.socket})
                    ]),
                    React.createElement('div', {className: 'col col-md-4 col-sm-5 col-lg-2 col-xl-2 py-1'}, [
                        React.createElement(RelaysCard, {socket: this.socket})
                    ]),
                    React.createElement('div', {className: 'col col-md-8 col-sm-10 col-lg-4 col-xl-4 py-1'}, [
                        React.createElement(ThermostatCard, {socket: this.socket})
                    ])
                ])
            ])
        ];
    }
};

class BrewserverNavBar extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return React.createElement('nav', { className: 'navbar navbar-expand-lg bg-primary'},
            React.createElement('div', { className: 'container-fluid' }, [
                React.createElement('a', { className: 'navbar-brand', href:'#' }, "EG's Brewserver")
            ])
        );
    }
};

class SocketErrorAlert extends React.Component {
    constructor(props) {
        super(props);
        this.state = {show: false};
    }

    componentDidMount() {
        this.props.socket.addEventListener('error', (event) => {
            this.setState({show: true});
        });
        this.props.socket.addEventListener('close', (event) => {
            this.setState({show: true});
        });
    }

    render() {
        if (this.state.show) {
            return React.createElement('div', {className: 'alert alert-danger', role: 'alert'},[
               React.createElement('div', {key: 0}, 'Socket not connected, refresh page!') 
            ]);
        } else {
            return;
        }
    }
}

class TemperaturesCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fermenterTemp: null,
            ambientTemp: null
        };
    }

    componentDidMount() {
        this.props.socket.addEventListener('message', (event) => {
            var data = JSON.parse(event.data);
            this.setState({
                fermenterTemp: data.status.temperature.fermenter,
                ambientTemp: data.status.temperature.ambient
            });
        })
    }

    render() {
        var ferm;
        var ambient;

        if (this.state.fermenterTemp==null) {
            ferm = React.createElement('td', {className: 'placeholder-glow'},
                React.createElement('span', {className: 'placeholder'}, 'null ')
            );
        } else {
            ferm = React.createElement('td', {}, `${this.state.fermenterTemp.toFixed(1)}\xb0`);
        }

        if (this.state.ambientTemp==null) {
            ambient = React.createElement('td', {className: 'placeholder-glow'},          
                React.createElement('span', {className: 'placeholder'}, 'null ')
            );
        } else {
            ambient = React.createElement('td', {}, `${this.state.ambientTemp.toFixed(1)}\xb0`);
        }

        return React.createElement('div', {className: 'card'},
            React.createElement('div', {className: 'card-body'}, [
                React.createElement('h5', {classname: 'card-title' }, 'Temperatures'),
                React.createElement('table', {className: 'table'},
                    React.createElement('tbody', {}, [
                        React.createElement('tr', {}, [
                            React.createElement('th', {scope:'row'}, 'Fermenter'),
                            ferm
                        ]),
                        React.createElement('tr', {}, [
                            React.createElement('th', {scope:'row'}, 'Ambient'),
                            ambient
                        ])
                    ])
                )
            ])
        );
    }
}

class RelaysCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            coolingOn: false,
            heatingOn: false
        };
    }

    componentDidMount() {
        this.props.socket.addEventListener('message', (event) => {
            var data = JSON.parse(event.data);
            this.setState({ 
                coolingOn: data.status.relay.cooling,
                heatingOn: data.status.relay.heating
            });
        })
    }

    render() {
        return React.createElement('div', {className: 'card'},
            React.createElement('div', {className: 'card-body'}, [
                React.createElement('h5', {classname: 'card-title' }, 'Relays'),
                React.createElement('table', {className: 'table'},
                    React.createElement('tbody', {}, [
                        React.createElement('tr', {}, [
                            React.createElement('th', {scope:'row'}, 'Cooling'),
                            React.createElement('td', {}, this.state.coolingOn ? 'ON' : 'OFF')
                        ]),
                        React.createElement('tr', {}, [
                            React.createElement('th', {scope:'row'}, 'Heating'),
                            React.createElement('td', {}, this.state.heatingOn ? 'ON' : 'OFF')
                        ])
                    ])
                )
            ])
        );
    }
}

class ThermostatCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            coolTarget: null,
            coolMin: null,
            heatTarget: null,
            heatMax: null,
            setModalTitle: 'No Title',
            setModalValue: null,
            setModalValueName: 'none',
            clearModalTitle: 'No Title',
            clearModalValueName: null,
            clearModalDesc: 'None'
        };
    }

    componentDidMount() {
        this.props.socket.addEventListener('message', (event) => {
            var data = JSON.parse(event.data);
            this.setState({
                coolTarget: data.status.thermostat.coolTargetTemp,
                coolMin: data.status.thermostat.coolMinTemp,
                heatTarget: data.status.thermostat.heatTargetTemp,
                heatMax: data.status.thermostat.heatMaxTemp
            });
        });
        this.setTempModal = new bootstrap.Modal('#setTempModal');
        this.clearTempModal = new bootstrap.Modal('#clearTempModal');
    }

    showSetModal(title, valName) {
        this.setState(
            (state) => {
                return {
                    setModalTitle: title,
                    setModalValue: state[valName],
                    setModalValueName: valName
                }; 
            },
            () => {
                this.setTempModal.show();
            }
        );
    }

    showClearModal(title, valName, desc) {
        this.setState(
            (state) => {
                return {
                    clearModalTitle: title,
                    clearModalValueName: valName,
                    clearModalDesc: desc
                };
            },
            () => {
                this.clearTempModal.show();
            }
        );
    }

    render() {
        return [
            React.createElement('div', {className: 'card'},
                React.createElement('div', {className: 'card-body'}, [
                    React.createElement('h5', {classname: 'card-title' }, 'Thermostat'),
                    React.createElement('table', {className: 'table'},
                        React.createElement('tbody', {}, [
                            React.createElement('tr', {}, [
                                React.createElement('th', {scope:'row'}, 'Cooling Target'),
                                React.createElement('td', {}, this.state.coolTarget==null ? "None" : `${this.state.coolTarget.toFixed(0)}\xb0`),
                                React.createElement('td', {},[
                                    React.createElement('div', {className:'btn-group', role:'group'}, [
                                        React.createElement('button', {type:'button', className:'btn btn-primary btn-sm', onClick: () => { this.showSetModal('Set Cooling Target', 'coolMin'); }}, 'Set'),
                                        React.createElement('button', {type:'button', className:'btn btn-danger btn-sm', onClick: () => { this.showClearModal('Clear Cooling Target', 'coolTarget', 'cooling target');}}, 'Clear')
                                    ])
                                ])
                            ]),
                            React.createElement('tr', {}, [
                                React.createElement('th', {scope:'row'}, 'Cooling Minimum'),
                                React.createElement('td', {}, this.state.coolMin==null ? "None" : `${this.state.coolMin.toFixed(0)}\xb0`),
                                React.createElement('td', {},[
                                    React.createElement('div', {className:'btn-group', role:'group'}, [
                                        React.createElement('button', {type:'button', className:'btn btn-primary btn-sm', onClick: () => { this.showSetModal('Set Cooling Minimum', 'coolMin'); }}, 'Set'),
                                        React.createElement('button', {type:'button', className:'btn btn-danger btn-sm', onClick: () => { this.showClearModal('Clear Cooling Minimum', 'coolMin', 'cooling minimum');}}, 'Clear')
                                    ])
                                ])
                            ]),
                            React.createElement('tr', {}, [
                                React.createElement('th', {scope:'row'}, 'Heating Target'),
                                React.createElement('td', {}, this.state.heatTarget==null ? "None" : `${this.state.heatTarget.toFixed(0)}\xb0`),
                                React.createElement('td', {},[
                                    React.createElement('div', {className:'btn-group', role:'group'}, [
                                        React.createElement('button', {type:'button', className:'btn btn-primary btn-sm', onClick: () => { this.showSetModal('Set Heating Target', 'heatTarget'); } }, 'Set'),
                                        React.createElement('button', {type:'button', className:'btn btn-danger btn-sm', onClick: () => { this.showClearModal('Clear Heating Target', 'heatTarget', 'heating target');}}, 'Clear')
                                    ])
                                ])
                            ]),
                            React.createElement('tr', {}, [
                                React.createElement('th', {scope:'row'}, 'Heating Maximum'),
                                React.createElement('td', {}, this.state.heatMax==null ? "None" : `${this.state.heatMax.toFixed(0)}\xb0`),
                                React.createElement('td', {},[
                                    React.createElement('div', {className:'btn-group', role:'group'}, [
                                        React.createElement('button', {type:'button', className:'btn btn-primary btn-sm', onClick: () => { this.showSetModal('Set Heating Maximum', 'heatMax'); }}, 'Set'),
                                        React.createElement('button', {type:'button', className:'btn btn-danger btn-sm', onClick: () => { this.showClearModal('Clear Heating Maximum', 'heatMax', 'heating maximum');}}, 'Clear')
                                    ])
                                ])
                            ])
                        ])
                    )
                ])
            ),
            React.createElement(SetTempModal, {id: 'setTempModal', title: this.state.setModalTitle, value: this.state.setModalValue, valueName: this.state.setModalValueName, onSave: ()=>{this.setTempModal.hide()}}),
            React.createElement(ClearTempModal, {id: 'clearTempModal', title: this.state.clearModalTitle, valueName: this.state.clearModalValueName, desc: this.state.clearModalDesc, onClear: () =>{this.clearTempModal.hide()}})
        ];
    }
}

class SetTempModal extends React.Component {
    constructor(props) {
        super(props);
    }

    doSet() {
        var val = document.querySelector(`#${this.props.id}Temperature`).value;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/set/${this.props.valueName}/${val}`);
        xhr.send();

        this.props.onSave();
    }

    render() {
        return React.createElement('div', {id: this.props.id, className: 'modal fade', tabIndex: -1, 'aria-hidden': true},
            React.createElement('div', {className: 'modal-dialog'},
                React.createElement('div', {className: 'modal-content'}, [
                    React.createElement('div', {className: 'modal-header'}, [
                        React.createElement('h1', {className: 'modal-title fs-5'}, this.props.title),
                        React.createElement('button', {type: 'button', className: 'btn-close', 'data-bs-dismiss': 'modal'})
                    ]),
                    React.createElement('div', {className: 'modal-body'}, [
                        React.createElement('div', {className: 'row g-3 align-items-center'}, [
                            React.createElement('div', {className: 'col-auto'},
                                React.createElement('label', {className: 'col-form-label'}, 'Temperature')
                            ),
                            React.createElement('div', {className: 'col-auto', for: `${this.props.id}Temperature`},
                                React.createElement('input', {type:'number', id: `${this.props.id}Temperature`, className: 'form-control'})
                            ),
                            React.createElement('div', {className: 'col-auto'},
                                React.createElement('span', {className: 'form-text'}, '\xb0 F')
                            )
                        ])
                    ]),
                    React.createElement('div', {className: 'modal-footer'}, [
                        React.createElement('button', {type:'button', className: 'btn btn-secondary', 'data-bs-dismiss':'modal'}, 'Close'),
                        React.createElement('button', {type:'button', className:'btn btn-primary', onClick: this.doSet.bind(this)}, 'Save')
                    ])
                ])
            )
        );
    }
}

class ClearTempModal extends React.Component {
    constructor(props) {
        super(props);
    }

    doClear() {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/clear/${this.props.valueName}`);
        xhr.send();

        this.props.onClear();
    }

    render() {
        return React.createElement('div', {id: this.props.id, className: 'modal fade', tabIndex: -1, 'aria-hidden': true},
            React.createElement('div', {className: 'modal-dialog'},
                React.createElement('div', {className: 'modal-content'}, [
                    React.createElement('div', {className: 'modal-header'}, [
                        React.createElement('h1', {className: 'modal-title fs-5'}, this.props.title),
                        React.createElement('button', {type: 'button', className: 'btn-close', 'data-bs-dismiss': 'modal'})
                    ]),
                    React.createElement('div', {className: 'modal-body'}, [
                        React.createElement('p', {}, `Are you sure you want to clear ${this.props.desc}?`)
                    ]),
                    React.createElement('div', {className: 'modal-footer'}, [
                        React.createElement('button', {type:'button', className: 'btn btn-secondary', 'data-bs-dismiss':'modal'}, 'No'),
                        React.createElement('button', {type:'button', className:'btn btn-danger', onClick: this.doClear.bind(this)}, 'Yes')
                    ])
                ])
            )
        );
    }
}

const pageContainer = document.querySelector('#pageContainer');
const pageRoot = ReactDOM.createRoot(pageContainer);
pageRoot.render(React.createElement(BrewserverPage, {}));