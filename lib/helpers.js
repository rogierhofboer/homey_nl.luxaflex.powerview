const { getScenes, getSceneCollection, getRooms } = require('./api');

sleep = async function (ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

minusPercent = function (n, p) {
    return n - n * (p / 100);
};

mergeByRoomId = function (a1, a2) {
    return a1.map((itm) => ({
        ...a2.find((item) => item.roomId === itm.roomId && item),
        ...itm
    }));
};

scenesAutoComplete = async function (query, device) {
    const settings = device.getSettings();
    const ip = settings.ip || settings['nl.luxaflex.powerview.settings.ip'];

    const scenes = await getScenes(ip);
    const rooms = await getRooms(ip);

    const merged = mergeByRoomId(scenes, rooms);

    let results = [];

    merged.forEach((m) => {
        results.push({
            id: m.sceneId,
            name: m.roomName + ' - ' + m.sceneName
        });
    });

    return (results = results.filter((r) => r.name.toLowerCase().indexOf(query.toLowerCase()) > -1));
};

sceneCollectionAutocomplete = async function (query, device) {
    const settings = device.getSettings();
    const ip = settings.ip || settings['nl.luxaflex.powerview.settings.ip'];

    const scenes = await getSceneCollection(ip);

    let results = [];

    scenes.forEach((m) => {
        results.push({
            id: m.sceneId,
            name: m.sceneName
        });
    });

    return (results = results.filter((r) => r.name.toLowerCase().indexOf(query.toLowerCase()) > -1));
};

module.exports = {
    sleep,
    scenesAutoComplete,
    sceneCollectionAutocomplete
};