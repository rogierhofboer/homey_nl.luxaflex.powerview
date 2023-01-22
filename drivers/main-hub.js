'use strict';

const rootDevice = require('./root-device');
const { getShades, getScenes, getSceneCollection } = require('../lib/api');

class mainHub extends rootDevice {
    async onInit() {
        try {
            const settings = this.getSettings();
            
            this.homey.app.log('[Device] - init =>', this.getName());
            this.setUnavailable(`Connecting to: ${this.getName()} ...`);

            await this.fixSettings();

            await this.checkCapabilities();

            await this.registerCapabilityListener('update_data', this.onCapability_UPDATE_DATA.bind(this));

            await this.setIntervalsAndFlows(true, settings.update_interval);
            await this.setAvailable();
        } catch (error) {
            this.homey.app.error(`[Device] ${this.getName()} - OnInit Error`, error);
        }
    }

    // ------------- Settings -------------
    async onSettings({ oldSettings, newSettings, changedKeys }) {
        this.homey.app.log(`[Device] ${this.getName()} - oldSettings`, { ...oldSettings });
        this.homey.app.log(`[Device] ${this.getName()} - newSettings`, { ...newSettings });

        if (changedKeys.length && changedKeys.includes('update_interval')) {
            this.setIntervalsAndFlows(false, newSettings.update_interval)
        }
    }

    //-------------- PowerView ----------------

    async updateData() {
        const settings = this.getSettings();
        const shades = await getShades(settings.ip, this.homey.app.apiClient);

        this.homey.app.log(`[Device] ${this.getName()} - updateData =>`, shades);

        this.homey.app.homeyEvents.emit('shadesUpdate', shades);
    }

    // ------------- Intervals -------------
    async setIntervalsAndFlows(override = false, time = 2) {
        try {
            this.homey.app.log(`[Device] ${this.getName()} - setIntervalsAndFlows override | time - `, override, time);

            if ((override || this.getAvailable()) && time > 0) {
                await this.setCapabilityValuesInterval(time);
            } else {
                this.homey.app.log(`[Device] ${this.getName()} - setIntervalsAndFlows not set - `, time);
            }
        } catch (error) {
            this.homey.app.log(`[Device] ${this.getName()} - OnInit Error`, error);
        }
    }

    async setCapabilityValuesInterval(update_interval) {
        try {
            const REFRESH_INTERVAL = 1000 * (update_interval * 60);

            this.homey.app.log(`[Device] ${this.getName()} - onPollInterval =>`, REFRESH_INTERVAL, update_interval);
            this.onPollInterval = setInterval(this.updateData.bind(this), REFRESH_INTERVAL);
        } catch (error) {
            this.setUnavailable(error);
            this.homey.app.log(error);
        }
    }

    async clearIntervals() {
        this.homey.app.log(`[Device] ${this.getName()} - clearIntervals`);
        await clearInterval(this.onPollInterval);
    }

    async onCapability_UPDATE_DATA(value) {
        try {
            this.homey.app.log(`[Device] ${this.getName()} - onCapability_UPDATE_DATA`, value);

            this.setCapabilityValue('update_data', false);

            await this.updateData();

            return Promise.resolve(true);
        } catch (e) {
            this.homey.app.error(e);
            return Promise.reject(e);
        }
    }
    async onCapability_sceneSet(value) {
        try {
            const settings = await this.getSettings();
            const ip = settings.ip || settings['nl.luxaflex.powerview.settings.ip'];

            this.homey.app.log(`[Device] ${this.getName()} - onCapability_sceneSet`, value);

            const sceneResponse = await getScenes(ip, this.homey.app.apiClient, value);

            this.homey.app.log(`[Device] ${this.getName()} - onCapability_sceneSet sceneResponse: `, sceneResponse);

            return Promise.resolve(true);
        } catch (e) {
            this.homey.app.error(e);
            return Promise.reject(e);
        }
    }

    async onCapability_sceneCollectionSet(value) {
        try {
            const settings = await this.getSettings();
            const ip = settings.ip || settings['nl.luxaflex.powerview.settings.ip'];

            this.homey.app.log(`[Device] ${this.getName()} - onCapability_sceneCollectionSet`, value);

            const sceneResponse = await getSceneCollection(ip, this.homey.app.apiClient, value);

            this.homey.app.log(`[Device] ${this.getName()} - onCapability_sceneCollectionSet sceneResponse: `, sceneResponse);

            return Promise.resolve(true);
        } catch (e) {
            this.homey.app.error(e);
            return Promise.reject(e);
        }
    }
}

module.exports = mainHub;