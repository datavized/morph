import React from 'react';
import { fromJS, Map } from 'immutable';
import {
	Store as IDBStore,
	get as dbGet,
	set as dbSet
} from 'idb-keyval';
import PropTypes from 'prop-types';

/*
Material UI components
*/
import withStyles from '@material-ui/core/styles/withStyles';

import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import MobileStepper from '@material-ui/core/MobileStepper';
import Button from '@material-ui/core/Button';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import Stepper from './Stepper';
import asyncComponent from './asyncComponent';
import SectionLoader from './SectionLoader';
import LoadFailure from './LoadFailure';
import UpgradePrompt from './UpgradePrompt';

const asyncOptions = {
	load: SectionLoader,
	fail: LoadFailure
};
const Upload = asyncComponent(() => import('./Upload'), asyncOptions);
const ReviewData = asyncComponent(() => import('./ReviewData'), asyncOptions);
const MapFields = asyncComponent(() => import('./MapFields'), asyncOptions);
const SelectChartType = asyncComponent(() => import('./SelectChartType'), asyncOptions);
const Evolution = asyncComponent(() => import('./Evolution'), asyncOptions);

import chartTypes from '../charts';

const styles = theme => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		backgroundColor: theme.palette.background.default
	},
	mobileStepper: {
	},
	content: {
		flex: 'auto'
	},
	'@media (min-width: 620px)': {
		mobileStepper: {
			display: 'none'
		}
	},
	button: {
		marginRight: theme.spacing.unit
	},
	currentButton: {
		backgroundColor: theme.palette.background.paper,
		color: theme.palette.primary.main
	}
});

const steps = [
	{
		label: 'Data',
		component: Upload,
		stateReady: () => true
	},
	{
		label: 'Review',
		component: ReviewData,
		stateReady: data => !!data.get('rows') &&
			data.get('rows').length > 0
	},
	{
		label: 'Design',
		component: SelectChartType,
		stateReady: data => !!data.get('rows') &&
			data.get('rows').length > 0
	},
	{
		label: 'Organize',
		component: MapFields,
		stateReady: data => !!data.get('chartType')
	},
	{
		label: 'Evolve',
		component: Evolution,
		stateReady: data => {
			const fieldMap = data.get('fieldMap');
			const chartType = data.get('chartType');
			if (!fieldMap) {
				return false;
			}
			const chartFieldMap = fieldMap.get(chartType);
			if (!chartFieldMap || !chartFieldMap.size) {
				return false;
			}

			// validate required fields
			const chartDef = chartTypes[chartType];
			if (chartDef.valid) {
				return chartDef.valid(chartFieldMap);
			}
			return !chartDef.required.some(key => !chartFieldMap.has(key));
		}
	}
];

const idbStore = new IDBStore('morph-db', 'morph-store');

class App extends React.Component {

	constructor(props) {
		super(props);

		let data = new Map();
		let currentStep = 0;
		try {
			/*
			This is the old way of storing data. We won't save any more data
			this way, but we'll try to load it just in case there's old data
			from a previous version.

			The next time it gets saved, we'll store it the new way and clear
			the old data out after it's successful.

			currentStep and exportOptions are small so we'll continue to keep
			them in localStorage and sessionStorage.
			*/
			const oldData = JSON.parse(localStorage.getItem('data') || '{}');
			const { rows, normalized, ...rest } = oldData;
			data = fromJS(rest);
			if (rows && rows.length && normalized && normalized.length === rows.length) {
				data = data.set('rows', rows).set('normalized', normalized);
			}

			currentStep = parseInt(sessionStorage.getItem('currentStep'), 10) || 0;
			currentStep = this.validateProgress(Math.max(1, currentStep), data);
		} catch (e) {}

		this.state = {
			currentStep,
			loading: true,
			data
		};
	}

	componentDidMount() {
		dbGet('data', idbStore).then(async storedData => {
			const oldData = this.state.data;
			let data = this.state.data;
			if (storedData) {
				const { rows, normalized, ...rest } = storedData;
				data = fromJS(rest);
				if (rows && rows.length && normalized && normalized.length === rows.length) {
					data = data.set('rows', rows).set('normalized', normalized);
				}
			}
			if (!data.isEmpty()) {
				try {
					if (!storedData) {
						/*
						We loaded old data from localStorage, and now we'll
						save it to IndexedDB.
						*/
						await dbSet('data', data.toJS());
					}
					if (oldData && !oldData.isEmpty()) {
						/*
						Successfully copied data to IndexedDB so now clear it
						out from localStorage
						*/
						localStorage.removeItem('data');
					}
				} catch (err) {
					console.warn('Unable to save data', err);
				}
			}
			this.setState({
				data,
				loading: false
			});
		}).catch(e => {
			console.warn('Unable to load data from previous session', e);
			this.setState({
				loading: false
			});
		});
		this.logScreenView(this.state.currentStep);
	}

	validateProgress = (progress, data) => {
		for (let i = 0, n = Math.min(progress + 1, steps.length); i < n; i++) {
			const step = steps[i];
			if (!step.stateReady(data)) {
				return Math.min(progress, i - 1);
			}
		}

		return Math.max(Math.min(progress, steps.length - 1), 0);
	}

	setData = fn => this.setState(({ data: previous }) => {
		const data = fn(previous);
		dbSet('data', data.toJS(), idbStore).catch(err => {
			console.warn('Unable to save data', err);
		});

		return {
			data
		};
	})

	logScreenView = currentStep => {
		if (window.ga) {
			window.ga('send', 'screenview', {
				screenName: steps[currentStep].label
			});
		}
	}

	goToStep = step => {
		const currentStep = this.validateProgress(step, this.state.data);
		try {
			sessionStorage.setItem('currentStep', currentStep);
		} catch (e) {}

		if (currentStep !== this.state.currentStep) {
			this.logScreenView(currentStep);
		}

		this.setState({
			currentStep
		});
	}

	onNext = () => {
		this.goToStep(this.state.currentStep + 1);
	}

	onBack = () => {
		this.goToStep(this.state.currentStep - 1);
	}

	render() {
		const {
			data,
			loading
		} = this.state;
		const progress = loading ? 0 : this.validateProgress(Infinity, data);
		const currentStep = Math.min(progress, this.state.currentStep);
		const { classes, upgradeReady } = this.props;
		const ChildComponent = steps[currentStep].component;

		const backButton = <Button size="small" onClick={this.onBack} disabled={currentStep === 0} className={classes.endButton}>
			<KeyboardArrowLeft />
			Back
		</Button>;
		const nextButton = <Button size="small" onClick={this.onNext} disabled={currentStep >= progress} className={classes.endButton} color="primary">
			Next
			<KeyboardArrowRight />
		</Button>;

		const navigation =
			<React.Fragment>
				<Stepper
					activeStep={currentStep}
				>
					{steps.map((step, index) =>
						<Step key={index} completed={progress > index}>
							<StepLabel icon={null}>
								<Button
									variant="raised"
									className={classes.button}
									classes={{
										raisedPrimary: index === currentStep ? classes.currentButton : null
									}}
									color="primary"
									onClick={() => this.goToStep(index)}
									disabled={loading || progress < index}
								>{index + 1 + '. ' + step.label}</Button>
							</StepLabel>
						</Step>
					)}
				</Stepper>
				<MobileStepper
					variant="dots"
					steps={steps.length}
					position="static"
					activeStep={currentStep}
					className={classes.mobileStepper}
					nextButton={nextButton}
					backButton={backButton}
				/>
			</React.Fragment>;

		return (
			<div className={classes.root}>
				{loading ? <SectionLoader/> : ChildComponent && <ChildComponent
					className={classes.content}
					highlightColor={this.props.theme.palette.primary.main}
					data={data}
					setData={this.setData}
					navigation={navigation}
					onBack={currentStep > 0 ? this.onBack : null}
					onNext={currentStep < steps.length - 1 ? this.onNext : null}
				/>}
				{navigation}
				<UpgradePrompt upgradeReady={upgradeReady}/>
			</div>
		);
	}
}

App.propTypes = {
	classes: PropTypes.object.isRequired,
	theme: PropTypes.object.isRequired,
	upgradeReady: PropTypes.bool
};

export default withStyles(styles, { withTheme: true })(App);
