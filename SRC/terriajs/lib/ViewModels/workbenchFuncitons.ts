export function hasShortReportSections(workbenchItem: any) {
  if (
    !workbenchItem.shortReportSections ||
    !workbenchItem.shortReportSections.length
  ) {
    return false;
  }
  return true;
}

export function checkIfColorControlableByRange(workbenchItem: any) {
  if (
    workbenchItem.customProperties &&
    workbenchItem.customProperties.colorControlableByRange
  ) {
    return true;
  }

  if (!hasShortReportSections(workbenchItem)) {
    return false;
  }
  return workbenchItem.shortReportSections[0].content.match(
    /COLOR_CONTROLABLE_BY_RANGE/
  )
    ? true
    : false;
}

export function getColorControlableByRangeInfo(workbenchItem: any) {
  if (
    workbenchItem.customProperties &&
    workbenchItem.customProperties.colorControlableByRange
  ) {
    return workbenchItem.customProperties.colorControlableByRange;
  }

  if (!hasShortReportSections(workbenchItem)) {
    return false;
  }

  const match = workbenchItem.shortReportSections[0].content.match(
    /COLOR_CONTROLABLE_BY_RANGE=\[.+?\]/
  );

  if (!match) {
    return null;
  }

  const info = JSON.parse(match[0].split("=")[1]);

  return info;
}

export function checkIfSwitchableStyles(workbenchItem: any) {
  if (
    !workbenchItem.customProperties ||
    !workbenchItem.customProperties.switchableStyles
  ) {
    return false;
  }
  return true;
}

export function checkIfDynamiColorBuiding(workbenchItem: any) {
  if (!hasShortReportSections(workbenchItem)) {
    return false;
  }
  if (checkIfColorControlableByRange(workbenchItem)) {
    return false;
  }

  return workbenchItem.shortReportSections[0].content.match(
    /DYNAMIC_COLOR_BUILDINGS/
  )
    ? true
    : false;
}

export function getDynamiColorBuidingInfo(workbenchItem: any) {
  if (!hasShortReportSections(workbenchItem)) {
    return false;
  }

  const match = workbenchItem.shortReportSections[0].content.match(
    /DYNAMIC_COLOR_BUILDINGS=\[.+?\]/
  );

  if (!match) {
    return null;
  }

  const info = JSON.parse(match[0].split("=")[1]);

  return info;
}

export function checkIfOpacityControlable(workbenchItem: any) {
  if (workbenchItem.customProperties?.opacityControlable) {
    return workbenchItem.customProperties.opacityControlable;
  }

  if (!hasShortReportSections(workbenchItem)) {
    return false;
  }

  return workbenchItem.shortReportSections[0].content.match(
    /OPACITY_CONTROLABLE/
  )
    ? true
    : false;
}

export function getTimelineInfo(workbenchItem: any) {
  if (
    workbenchItem.customProperties &&
    workbenchItem.customProperties.timeline
  ) {
    return workbenchItem.customProperties.timeline;
  }

  if (!hasShortReportSections(workbenchItem)) {
    return false;
  }

  const match = workbenchItem.shortReportSections[0].content.match(
    /TIMELINE={.+?}/
  );

  if (!match) {
    return null;
  }

  const timelineInfo = JSON.parse(match[0].split("=")[1]);

  return timelineInfo;
}

export function getInitialCameraInfo(workbenchItem: any) {
  if (
    workbenchItem.customProperties &&
    workbenchItem.customProperties.initialCamera
  ) {
    return workbenchItem.customProperties.initialCamera;
  }

  if (!hasShortReportSections(workbenchItem)) {
    return false;
  }

  const match = workbenchItem.shortReportSections[0].content.match(
    /INITIAL_CAMERA={\s*\"west\"\s*:\s*[0-9|\.]+,\s*\"south\"\s*:\s*[0-9|\.]+,\s*\"east\"\s*:\s*[0-9|\.]+,\s*\"north\"\s*:\s*[0-9|\.]+,\s*\"position\"\s*:\s*{\s*\"x\"\s*:\s*-?[0-9|\.]+,\s*\"y\"\s*:\s*-?[0-9|\.]+,\s*\"z\"\s*:\s*-?[0-9|\.]+\s*},\s*\"direction\"\s*:\s*{\s*\"x\"\s*:\s*-?[0-9|\.]+,\s*\"y\"\s*:\s*-?[0-9|\.]+,\s*\"z\"\s*:\s*-?[0-9|\.]+\s*},\s*\"up\"\s*:\s*{\s*\"x\"\s*:\s*-?[0-9|\.]+,\s*\"y\"\s*:\s*-?[0-9|\.]+,\s*\"z\"\s*:\s*-?[0-9|\.]+\s*}}/
  );

  if (!match) {
    return null;
  }

  const initialCameraInfo = JSON.parse(match[0].split("=")[1]);

  return initialCameraInfo;
}

export function getSwitchableUrls(workbenchItem: any) {
  if (
    workbenchItem.customProperties &&
    workbenchItem.customProperties.switchableUrls
  ) {
    return workbenchItem.customProperties.switchableUrls;
  }

  if (!hasShortReportSections(workbenchItem)) {
    return null;
  }

  const match = workbenchItem.shortReportSections[0].content.match(
    /URL_SWITCHABLE=\[.+?\]/
  );

  if (!match) {
    return null;
  }

  return JSON.parse(match[0].split("=")[1]);
}

export function getVrUrlRoot(workbenchItem: any) {
  if (
    workbenchItem.customProperties &&
    workbenchItem.customProperties.panasonicVrMarker
  ) {
    return workbenchItem.customProperties.panasonicVrMarker;
  }

  if (!hasShortReportSections(workbenchItem)) {
    return null;
  }

  const match = workbenchItem.shortReportSections[0].content.match(
    /PANASONIC_VR_MARKER=\S+/
  );

  if (!match) {
    return null;
  }

  return match[0].split("=")[1];
}

export function getStories(workbenchItem: any) {
  return workbenchItem.customProperties?.stories;
}
