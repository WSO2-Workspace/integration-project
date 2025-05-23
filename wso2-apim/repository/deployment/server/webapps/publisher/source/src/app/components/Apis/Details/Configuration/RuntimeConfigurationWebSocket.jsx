/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useReducer, useContext, useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { Link, useHistory } from 'react-router-dom';
import FormGroup from '@mui/material/FormGroup';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccordionSummary from '@mui/material/AccordionSummary';
import WrappedExpansionPanel from 'AppComponents/Shared/WrappedExpansionPanel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import Alert from 'AppComponents/Shared/Alert';
import ArrowForwardIcon from '@mui/icons-material/SettingsEthernet';
import { APIContext } from 'AppComponents/Apis/Details/components/ApiContext';
import CustomSplitButton from 'AppComponents/Shared/CustomSplitButton';
import { isRestricted } from 'AppData/AuthManager';
import API from 'AppData/api';
import { usePublisherSettings } from 'AppComponents/Shared/AppContext';
import Endpoints from './components/Endpoints';
import KeyManager from './components/KeyManager';
import APILevelRateLimitingPolicies from './components/APILevelRateLimitingPolicies';
import {
    DEFAULT_API_SECURITY_OAUTH2,
    API_SECURITY_API_KEY
} from './components/APISecurity/components/apiSecurityConstants';

const PREFIX = 'RuntimeConfigurationWebSocket';

const classes = {
    root: `${PREFIX}-root`,
    titleWrapper: `${PREFIX}-titleWrapper`,
    boxFlex: `${PREFIX}-boxFlex`,
    mainTitle: `${PREFIX}-mainTitle`,
    paper: `${PREFIX}-paper`,
    paperCenter: `${PREFIX}-paperCenter`,
    heading: `${PREFIX}-heading`,
    itemPadding: `${PREFIX}-itemPadding`,
    arrowForwardIcon: `${PREFIX}-arrowForwardIcon`,
    expansionPanel: `${PREFIX}-expansionPanel`,
    expansionPanelDetails: `${PREFIX}-expansionPanelDetails`,
    subHeading: `${PREFIX}-subHeading`,
    info: `${PREFIX}-info`
};


const Root = styled('div')((
    {
        theme
    }
) => ({
    [`& .${classes.root}`]: {
        padding: theme.spacing(3, 2),
    },

    [`& .${classes.titleWrapper}`]: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing(3),
    },

    [`& .${classes.boxFlex}`]: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    [`& .${classes.mainTitle}`]: {
        paddingLeft: 0,
    },

    [`& .${classes.paper}`]: {
        padding: theme.spacing(3),
        minHeight: '250px',
    },

    [`& .${classes.paperCenter}`]: {
        padding: theme.spacing(3),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },

    [`& .${classes.heading}`]: {
        fontSize: '1.1rem',
        fontWeight: 400,
        marginBottom: theme.spacing(1),
    },

    [`& .${classes.itemPadding}`]: {
        marginBottom: theme.spacing(3),
    },

    [`& .${classes.arrowForwardIcon}`]: {
        fontSize: 50,
        color: '#ccc',
        position: 'absolute',
        top: 175,
        right: -55,
    },

    [`& .${classes.expansionPanel}`]: {
        marginBottom: theme.spacing(1),
    },

    [`& .${classes.expansionPanelDetails}`]: {
        flexDirection: 'column',
    },

    [`& .${classes.subHeading}`]: {
        fontSize: '1rem',
        fontWeight: 400,
        margin: 0,
        display: 'inline-flex',
        lineHeight: '38px',
    },

    [`& .${classes.info}`]: {
        display: 'flex',
        height: '100%',
    },

    [`& .${classes.error}`]: {
        color: theme.palette.error.main,
    },
}));

/**
 *
 * Deep coping the properties in API object (what ever the object in the state),
 * making sure that no direct mutations happen when updating the state.
 * You should know the shape of the object that you are keeping in the state,
 * @param {Object} api
 * @returns {Object} Deep copy of an object
 */
function copyAPIConfig(api) {
    const keyManagers = api.apiType === API.CONSTS.APIProduct ? ['all'] : [...api.keyManagers];
    return {
        id: api.id,
        name: api.name,
        description: api.description,
        lifeCycleStatus: api.lifeCycleStatus,
        accessControl: api.accessControl,
        authorizationHeader: api.authorizationHeader,
        responseCachingEnabled: api.responseCachingEnabled,
        cacheTimeout: api.cacheTimeout,
        visibility: api.visibility,
        apiThrottlingPolicy: api.apiThrottlingPolicy,
        isDefaultVersion: api.isDefaultVersion,
        enableSchemaValidation: api.enableSchemaValidation,
        accessControlRoles: [...api.accessControlRoles],
        visibleRoles: [...api.visibleRoles],
        tags: [...api.tags],
        maxTps: api.maxTps,
        wsdlUrl: api.wsdlUrl,
        transport: [...api.transport],
        securityScheme: [...api.securityScheme],
        corsConfiguration: {
            corsConfigurationEnabled: api.corsConfiguration.corsConfigurationEnabled,
            accessControlAllowCredentials: api.corsConfiguration.accessControlAllowCredentials,
            accessControlAllowOrigins: [...api.corsConfiguration.accessControlAllowOrigins],
            accessControlAllowHeaders: [...api.corsConfiguration.accessControlAllowHeaders],
            accessControlAllowMethods: [...api.corsConfiguration.accessControlAllowMethods],
        },
        keyManagers,
    };
}
/**
 * This component handles the basic configurations UI in the API details page
 *
 * @export
 * @param {*} props
 * @returns
 */
export default function RuntimeConfiguration() {
    /**
     *
     * Reduce the configuration UI related actions in to updated state
     * @param {*} state current state
     * @param {*} configAction dispatched configuration action
     * @returns {Object} updated state
     */
    function configReducer(state, configAction) {
        const { action, value } = configAction;
        const nextState = { ...copyAPIConfig(state) };
        switch (action) {
            case 'apiThrottlingPolicy':
            case 'maxTps':
                nextState[action] = value;
                return nextState;
            case 'keymanagers':
                nextState.keyManagers = value;
                return nextState;
            case 'throttlingPoliciesEnabled':
                if (value) {
                    nextState.apiThrottlingPolicy = '';
                } else {
                    nextState.apiThrottlingPolicy = null;
                }
                return nextState;
            case 'allKeyManagersEnabled':
                if (value) {
                    nextState.keyManagers = ['all'];
                } else {
                    nextState.keyManagers = [];
                }
                return nextState;
            case 'securityScheme':
                if (value.checked) {
                    nextState.securityScheme = [...nextState.securityScheme, value.value];
                } else {
                    nextState.securityScheme = nextState.securityScheme.filter((item) => item !== value.value);
                }
                return nextState;
            default:
                return state;
        }
    }
    const { api, updateAPI } = useContext(APIContext);
    const [isUpdating, setIsUpdating] = useState(false);
    const history = useHistory();
    const [apiConfig, configDispatcher] = useReducer(configReducer, copyAPIConfig(api));
    const { data: publisherSettings, isLoading } = usePublisherSettings();
    const [endpointSecurity, setEndpointSecurity] = useState([]);

    useEffect(() => {
        if (!isLoading) {
            setEndpointSecurity(publisherSettings.gatewayFeatureCatalog
                .gatewayFeatures[api.gatewayType ? api.gatewayType : 'wso2/synapse'].endpoints);
        }
    }, [isLoading]);


    const Validate = () => {

        if (!apiConfig.securityScheme.includes(DEFAULT_API_SECURITY_OAUTH2)
            && !apiConfig.securityScheme.includes(API_SECURITY_API_KEY)
        ) {
            return (
                <Typography className={classes.bottomSpace}>
                    <FormattedMessage
                        id='Apis.Details.Configuration.RuntimeConfigurationWebsocket.RuntimeConfiguration.emptySchemes'
                        defaultMessage='Please select at least one API security method.'
                    />
                </Typography>
            );
        }
        return null;
    };

    /**
     *
     * Handle the configuration view save button action
     */
    function handleSave() {
        setIsUpdating(true);

        updateAPI(apiConfig)
            .catch((error) => {
                if (error.response) {
                    Alert.error(error.response.body.description);
                }
            })
            .finally(() => setIsUpdating(false));
    }

    function handleSaveAndDeploy() {
        setIsUpdating(true);

        updateAPI(apiConfig)
            .catch((error) => {
                if (error.response) {
                    Alert.error(error.response.body.description);
                }
            })
            .finally(() => history.push({
                pathname: api.isAPIProduct() ? `/api-products/${api.id}/deployments`
                    : `/apis/${api.id}/deployments`,
                state: 'deploy',
            }));
    }

    return (
        <Root>
            <Box pb={3}>
                <Typography variant='h5'>
                    <FormattedMessage
                        id='Apis.Details.Configuration.RuntimeConfigurationWebSocket.topic.header'
                        defaultMessage='Runtime Configurations'
                    />
                </Typography>
            </Box>
            <div className={classes.contentWrapper}>
                <Grid container direction='row' justifyContent='space-around' alignItems='stretch' spacing={8}>
                    <Grid item xs={12} md={7} sx={{ marginBottom: 30, position: 'relative' }}>
                        <WrappedExpansionPanel className={classes.expansionPanel} id='applicationLevel'>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography className={classes.subHeading} variant='h6' component='h4'>
                                    <FormattedMessage
                                        id='Apis.Details.Configuration.Components.APISecurity.Components.
                                            ApplicationLevel.Client.Websocket'
                                        defaultMessage='Client Websocket'
                                    />
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails className={classes.expansionPanelDetails}>
                                <Typography className={classes.subHeading} variant='h6' component='h4'>
                                    <FormattedMessage
                                        id='Apis.Details.Configuration.Components.APISecurity.Components.
                                            ApplicationLevel.Websocket'
                                        defaultMessage='Application Level Security'
                                    />
                                </Typography>
                                <FormGroup sx={{ display: 'flow-root' }}>
                                    <FormControlLabel
                                        control={(
                                            <Checkbox
                                                disabled={isRestricted(['apim:api_create'], apiConfig)}
                                                checked={apiConfig.securityScheme.includes(DEFAULT_API_SECURITY_OAUTH2)}
                                                onChange={({ target: { checked, value } }) => configDispatcher({
                                                    action: 'securityScheme',
                                                    value: { checked, value },
                                                })}
                                                value={DEFAULT_API_SECURITY_OAUTH2}
                                                color='primary'
                                            />
                                        )}
                                        label='OAuth2'
                                    />
                                    <FormControlLabel
                                        control={(
                                            <Checkbox
                                                checked={apiConfig.securityScheme.includes(API_SECURITY_API_KEY)}
                                                disabled={isRestricted(['apim:api_create'], apiConfig)}
                                                onChange={({ target: { checked, value } }) => configDispatcher({
                                                    action: 'securityScheme',
                                                    value: { checked, value },
                                                })}
                                                value={API_SECURITY_API_KEY}
                                                color='primary'
                                                id='api-security-api-key-checkbox'
                                            />
                                        )}
                                        label='Api Key'
                                    />
                                </FormGroup>
                                <KeyManager api={apiConfig} configDispatcher={configDispatcher} />
                                <span className={classes.error}>
                                    <Validate />
                                </span>
                            </AccordionDetails>
                        </WrappedExpansionPanel>
                        <APILevelRateLimitingPolicies api={apiConfig} configDispatcher={configDispatcher} />
                        <ArrowForwardIcon className={classes.arrowForwardIcon} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography className={classes.heading} variant='h6'>
                            <FormattedMessage
                                id='Apis.Details.Configuration.RuntimeConfigurationWebSocket.section.backend.websocket'
                                defaultMessage='Backend Websocket'
                            />
                        </Typography>
                        <Paper className={classes.paper} sx={{ height: 'calc(100% - 75px)' }} elevation={0}>
                            {!api.isAPIProduct() && (
                                <>
                                    <Endpoints api={api} endpointSecurity={endpointSecurity} />
                                </>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid container direction='row' alignItems='center' spacing={1} sx={{ marginTop: 20 }}>
                        <Grid item>
                            {api.isRevision
                                || ((apiConfig.visibility === 'RESTRICTED' && apiConfig.visibleRoles.length === 0)
                                || isRestricted(['apim:api_create'], api)) ? (
                                    <Button
                                        disabled
                                        type='submit'
                                        variant='contained'
                                        color='primary'
                                    >
                                        <FormattedMessage
                                            id='Apis.Details.Configuration.Configuration.save'
                                            defaultMessage='Save'
                                        />
                                    </Button>
                                ) : (
                                    <CustomSplitButton
                                        advertiseInfo={api.advertiseInfo}
                                        api={api}
                                        handleSave={handleSave}
                                        handleSaveAndDeploy={handleSaveAndDeploy}
                                        isUpdating={isUpdating}
                                    />
                                )}
                        </Grid>
                        <Grid item>
                            <Link to={'/apis/' + api.id + '/overview'}>
                                <Button>
                                    <FormattedMessage
                                        id='Apis.Details.Configuration.Configuration.cancel'
                                        defaultMessage='Cancel'
                                    />
                                </Button>
                            </Link>
                        </Grid>
                    </Grid>
                </Grid>
            </div>
        </Root>
    );
}
