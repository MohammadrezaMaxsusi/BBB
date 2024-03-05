import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { useMutation } from '@apollo/client';
import VideoProvider from './component';
import VideoService from './service';
import { sortVideoStreams } from '/imports/ui/components/video-provider/stream-sorting';
import { CAMERA_BROADCAST_START, CAMERA_BROADCAST_STOP } from './mutations';

const { defaultSorting: DEFAULT_SORTING } = Meteor.settings.public.kurento.cameraSortingModes;

const VideoProviderContainer = ({ children, ...props }) => {
  const { streams, isGridEnabled } = props;
  const [cameraBroadcastStart] = useMutation(CAMERA_BROADCAST_START);
  const [cameraBroadcastStop] = useMutation(CAMERA_BROADCAST_STOP);

  const sendUserShareWebcam = (cameraId) => {
    cameraBroadcastStart({ variables: { cameraId } });
  };

  const sendUserUnshareWebcam = (cameraId) => {
    cameraBroadcastStop({ variables: { cameraId } });
  };

  const playStart = (cameraId) => {
    if (VideoService.isLocalStream(cameraId)) {
      sendUserShareWebcam(cameraId);
      VideoService.joinedVideo();
    }
  };

  return (
    !streams.length && !isGridEnabled
      ? null
      : (
        <VideoProvider
          {...props}
          playStart={playStart}
          sendUserUnshareWebcam={sendUserUnshareWebcam}
        >
          {children}
        </VideoProvider>
      )
  );
};

export default withTracker(({ swapLayout, ...rest }) => {
  // getVideoStreams returns a dictionary consisting of:
  // {
  //  streams: array of mapped streams
  //  totalNumberOfStreams: total number of shared streams in the server
  // }
  const {
    streams,
    gridUsers,
    totalNumberOfStreams,
  } = VideoService.getVideoStreams();

  let usersVideo = streams;

  if(gridUsers.length > 0) {
    const items = usersVideo.concat(gridUsers);
    usersVideo = sortVideoStreams(items, DEFAULT_SORTING);
  }

  return {
    swapLayout,
    streams: usersVideo,
    totalNumberOfStreams,
    isUserLocked: VideoService.isUserLocked(),
    currentVideoPageIndex: VideoService.getCurrentVideoPageIndex(),
    isMeteorConnected: Meteor.status().connected,
    ...rest,
  };
})(VideoProviderContainer);
