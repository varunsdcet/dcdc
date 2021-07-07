import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Platform,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  StatusBar,
  Alert,
  BackHandler,

  StyleSheet,
  Dimensions,
} from 'react-native';
import User from './User.js';
var randomString = require('random-string');
var x = randomString({
    length: 20,
    numeric: true,
    letters: true,
    special: false,
    exclude: ['a', 'b']
});
import CountDown from 'react-native-countdown-component';
import * as Animatable from 'react-native-animatable';
import RBSheet from "react-native-raw-bottom-sheet";
import Toast from 'react-native-simple-toast';
import Started from './Started.js';
import End from './End.js';
import io from 'socket.io-client';
const socket = io('http://139.59.25.187:3355', {
  transports: ['websocket']
})
import store from '../redux/store';
const GLOBAL = require('./Global');
import Backend from "./Backend.js";


// import {SOCKET_URL} from '../service/Config';
// import {EndLive} from from '../backend/Api';
// NOTE: remove this dependency if you want don't want loud speaker ability
import RNSwitchAudioOutput from 'react-native-switch-audio-output';
import Chat from './Chat';

import StreamView from './StreamView';
const window = Dimensions.get('window');
import useAntMedia from './useAntMedia';
import styles from './styles';
import {LoginOtpApi,SignInApi,Explore,FetchHomeWallet,PujaStart,GetProfileApi,EndLive,TogleFollow,CheckFollow} from '../backend/Api';
const {width} = Dimensions.get('window');
const pc_config = { iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }] };
const webSocketUrl = 'https://callmyastro.com:5443/LiveApp/websocket';
const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  absView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  videoView: {
    padding: 5,
    flexWrap: 'wrap',
    flexDirection: 'row',
    zIndex: 100,
  },
  localView: {
    flex: 1,
  },
  duration: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  absView: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  absViews: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: window.width,
    height: 80,
    justifyContent: 'space-between',
  },
  remoteView: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    margin: 5,
  },
  bottomView: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
const Antq = ({navigation,route}) => {

  const refRBSheet = useRef();
    const RBSheetUser = useRef();
    const rBSheetend = useRef();
    const RBSheetstarted = useRef();
const [joiner, setjoiner] = useState([]);
  const [localStream, setLocalStream] = useState('');
    const [name, setName] = useState('');
      const [wallet, setWallet] = useState('');
      const [bookingid ,setbookingid] = useState('');
        const [message, setmessage] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [roomId, setRoomId] = useState(route.params.item.bridge_id);
  const [isMute, setIsMute] = useState(false);
  const [isMuteVideo, setIsMuteVideo] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isFront, setIsFront] = useState(true);
  const[getamount,setgetamount] =useState('');
  const [shown, setshown] = useState(false);
  const [join, setJoin] = useState(false);
  const [anim, setanim] = useState(false);
    const [mydata, setmydata] = useState({});
    //anim
  const [maximizedStream, setMaximizedStream] = useState(null);
  const stream = useRef({ id: '' }).current;
  let roomTimerId = useRef(null).current;
  let streamsList = useRef([]).current;
// const  socket = io(SOCKET_URL, {
//     transports: ['websocket'],
//   });
  const { width, height } = Dimensions.get('screen');

  const adaptor = useAntMedia({
    url: webSocketUrl,
    mediaConstraints: {
      video: false,
      audio: true,
    },
    sdp_constraints: {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    },
    bandwidth: 300,
    peerconnection_config: pc_config,
    callback(command, data) {
      //alert(command)
      switch (command) {
        case 'pong':

          break;
        case 'joinedTheRoom':
          const tok = data.ATTR_ROOM_NAME;
          this.initPeerConnection(data.streamId);
          this.publish(data.streamId, tok);
          stream.id = data.streamId;
          const streams = data.streams;

          if (streams != null) {
            streams.forEach((item) => {
              if (item === stream.id) return;
              this.play(item, tok, roomId);
            });
            streamsList = streams;
          }
          roomTimerId = setInterval(() => {
          //  alert(data.streamId)
            this.getRoomInfo(roomId, data.streamId);
          }, 3000);
          break;
        case 'publish_started':
          setIsPublishing(false);
          break;
        case 'publish_finished':
          streamsList = [];
          setIsPublishing(false);
          break;
        case 'streamJoined':

          this.play(data.streamId, undefined, roomId);
          break;
        case 'leavedFromRoom':
          console.log('leavedFromRoom');
          clearRoomInfoInterval();
          break;
        case 'roomInformation':
          const token = data.ATTR_ROOM_NAME;
          for (let str of data.streams) {
            if (!streamsList.includes(str)) {

              this.play(str, token, roomId);
            }
          }
          streamsList = data.streams;
          console.log(Platform.OS, 'roomInformation', data);
          break;
        default:
          break;
      }
    },
    callbackError: (err, data) => {
      console.log('callbackError', err, data);
      if (err == "no_stream_exist"){
      //adaptor.leaveFromRoom(roomId);

      //  alert('Broadcast Out from Broadcast')
      //  navigation.goBack()
      }
    //  clearRoomInfoInterval();
    },
  });

  const clearRoomInfoInterval = () => {
    if (roomTimerId != null) {
      console.log('interval cleared');
      clearInterval(roomTimerId);
    }
  };

  const handleConnect3 = useCallback(() => {

    if (adaptor) {



    // alert(roomId)
      adaptor.joinRoom(roomId,x);


  //  adaptor.joinRoomw(roomId,`${GLOBAL.user_id}`);

//     setTimeout(() => {
//   handleMute()
//
// }, 3000);
      //handleMute()
      //adaptor.play(`${route.params.item.astrologer.id}`,null,roomId)
      //setIsPublishing(true);
    }
  });
  const handleConnect2 = useCallback(() => {

    if (adaptor) {


    // alert(roomId)
    adaptor.joinRoom(roomId,"mergedStream");
    //  adaptor.joinRoom(roomId,"mergedStream");


  //  adaptor.joinRoomw(roomId,`${GLOBAL.user_id}`);

//     setTimeout(() => {
//   handleMute()
//
// }, 3000);
      //handleMute()
      //adaptor.play(`${route.params.item.astrologer.id}`,null,roomId)
      //setIsPublishing(true);
    }
  });

  const handleConnect33 = useCallback(() => {

    if (adaptor) {


  //  alert(roomId)
    adaptor.joinRoomw(roomId,`user${GLOBAL.user_id}`);
    //  adaptor.joinRoom(roomId,"mergedStream");


  //  adaptor.joinRoomw(roomId,`${GLOBAL.user_id}`);

//     setTimeout(() => {
//   handleMute()
//
// }, 3000);
      //handleMute()
      //adaptor.play(`${route.params.item.astrologer.id}`,null,roomId)
      //setIsPublishing(true);
    }
  });

  const handleConnect = useCallback(() => {

    if (adaptor) {

    // alert(roomId)
      adaptor.joinRoomw(roomId,"223");
      //setIsPublishing(true);
    }
  }, [adaptor, roomId]);

  const handleDisconnect = useCallback(() => {
    //alert(JSON.stringify(adaptor))
    if (adaptor) {
    //  allStreams.remove()
      adaptor.leaveFromRoom(roomId);
      clearRoomInfoInterval();
      setIsPublishing(false);
      setMaximizedStream(null);
    }
  }, [adaptor, roomId, roomTimerId]);

  const handleMute = useCallback(() => {
    if (adaptor) {
      adaptor.handleTurnVolume();
      setIsMute(!isMute);
    }
  }, [adaptor, isMute]);

  const handleVideo = useCallback(() => {
    if (adaptor) {
      adaptor.handleTurnCamera();
      setIsMuteVideo(!isMuteVideo);
    }
  }, [adaptor, isMuteVideo]);

  const switchCamera = useCallback(() => {
    if (adaptor) {
      adaptor.switchCamera();
      setIsFront(!isFront);
    }
  }, [adaptor, isFront]);

  const switchAudio = useCallback(() => {
    RNSwitchAudioOutput.selectAudioOutput(
      isSpeaker
        ? RNSwitchAudioOutput.AUDIO_SPEAKER
        : RNSwitchAudioOutput.AUDIO_SPEAKER,
    );
    setIsSpeaker(!isSpeaker);
  }, [isSpeaker]);

  const switchAudio1 = useCallback(() => {
    RNSwitchAudioOutput.selectAudioOutput(
      isSpeaker
        ? RNSwitchAudioOutput.AUDIO_SPEAKER
        : RNSwitchAudioOutput.AUDIO_SPEAKER,
    );
    setIsSpeaker(!isSpeaker);
  }, [isSpeaker]);


const navigateToScreen1 = () =>{
  handleDisconnect()
  const socket = io('http://139.59.25.187:3355', {
    transports: ['websocket']
  })

  socket.emit('leave_broadcast',{

                                  astrologer_id:GLOBAL.another,
                                  user_id:store.getState().user.id,
                                  bridge_id:GLOBAL.bookingid
               })
  checkexist('Left the Live')

navigation.goBack()
}

const toy = () =>{
  Alert.alert('astrohelp24','Are you sure want to exist',
                  [{text:"Cancel"},
                      {text:"Yes", onPress:()=>navigateToScreen1()
                      },
                  ],
                  {cancelable:false}
              )
}

const checkexist = (item) =>{


    var k = ""

 k =   item


 var x = randomString({
     length: 20,
     numeric: true,
     letters: true,
     special: false,
     exclude: ['a', 'b']
 });

 var array = [];
 var users = {
     _id: store.getState().user.id,
     name: GLOBAL.myname,
 }

 var today = new Date();
 /* today.setDate(today.getDate() - 30);
 var timestamp = new Date(today).toISOString(); */
 var timestamp = today.toISOString();
 var dict = {
     text:k,
     user: users,
     createdAt: timestamp,
     _id: x,


     // etc.
 };
 array.push(dict)
 //Backend.load()

 Backend.sendMessage(array)

}

const   checkwallets = () =>{

  FetchHomeWallet({user_id:GLOBAL.user_id})
       .then((data) => {
        console.log(JSON.stringify(data))
         if (data.status) {

           setName(data.user.name)
           GLOBAL.wallet = data.wallet


           // const [name, setName] = useState('');
           //   const [wallet, setWallet] = useState('');

GLOBAL.myname = data.user.name


  checkexist('Joined the Live 👋')
//alert(data.wallet)
//setnotification(data.notification_count)


         } else {

         }
       })
       .catch((error) => {
         console.log('error', error);
       });
}


const checkjoiner = () =>{
  const socket = io('http://139.59.25.187:3355', {
    transports: ['websocket']
  })

  socket.on("broadcasters_joiners", msg => {


  if (msg.status == true){
    var a = msg.data
    //alert(JSON.stringify(adaptor.iceCandidateList))
    if (a.length == 0){

        setjoiner(msg.data)

      setJoin(false)
    //  adaptor.leaveFromRoom(roomId)


    }else{

      if (a[0].user_id == GLOBAL.user_id){
setJoin(true)
            handleConnect33()

      }else{
  setjoiner(msg.data)
        setJoin(false)

  //  adaptor.leaveFromRoom(roomId)
  //   adaptor.stop(`user${GLOBAL.user_id}`);
        handleConnect2()
        setTimeout(() => {
        // write your functions
        handleConnect2()
      },3000);
      setTimeout(() => {
      // write your functions
      handleConnect2()
    },5000);
    setTimeout(() => {
    // write your functions
    handleConnect2()
  },8000);
        //setJoin(false)
    //  handleDisconnect()
    //    RtcEngine.setClientRole(Audience)
      }
      //alert(JSON.stringify(msg.data[0]))
      setjoiner([])
      if (join == true){
      //  adaptor.leaveFromRoom(roomId)
        // clearRoomInfoInterval();
        // setIsPublishing(false);
        // setMaximizedStream(null);
      }
      setjoiner(msg.data)

      // this.setState({joiner:msg.data})
      // this.setState({rtime:msg.data[0].remaining_time})
    }



  }else{
    setjoiner([])

  //  RtcEngine.setClientRole(Audience)

  }

    });


  socket.emit('broadcasters_joiners',{
                                  user_id:GLOBAL.user_id,
                                  bridge_id:GLOBAL.bookingid,
                                  astrologer_id:GLOBAL.another
               })
}


const toggleMic= () => {

}

useEffect(() => {
  if (join == true){
  //  alert("5555")
  handleConnect33()
  }
  if (join == false){
    alert(JSON.stringify(adaptor.iceCandidateList))
    handleConnect2()
  }


},[adaptor,join])

const backButtonHandler = () =>{
  //alert(JSON.stringify(adaptor))
  // if (adaptor){
  //   adaptor == null
  //    adaptor.leaveFromRoom()
  // }

}

useEffect(() => {
switchAudio()
BackHandler.addEventListener("hardwareBackPress", backButtonHandler);

//   return () => {
//     BackHandler.removeEventListener("hardwareBackPress", backButtonHandler);
//   };

},[])
useEffect(() => {
//toggleMic()
checkjoiner()
  //handleVideo()
  const socket = io('http://139.59.25.187:3355', {
    transports: ['websocket']
  })

  socket.on("broadcast_time_expired_user", msg => {
    console.log('remove1234')
console.log(JSON.stringify(msg))

    if (msg.status == true){
      adaptor.leaveFromRoom(roomId)
    // navigation.goBack()
    }else{

    //setpujaData(msg.data)
    }
  }
  )

  socket.emit('broadcast_time_expired_user',{

                                  bridge_id:GLOBAL.bookingid,
                                  user_id:GLOBAL.user_id
               })

  socket.on("end_broadcast", msg => {


    if (msg.status == true){
     navigation.goBack()
    }else{

    //setpujaData(msg.data)
    }
  }
  )
  socket.on("gift_sender_user", msg => {
  //this.setState({status:false})
  if (msg.status == true){
  //alert(JSON.stringify(msg))
  setshown(true)
  setTimeout(() => {
  // write your functions
    setshown(false)
},3000);

  setmydata(msg.data)
  setanim(true)
    //setmessage(msg.data)

  }else{

  //setmessage([])
  }

    });

    socket.emit('gift_sender_user',{

                                    bridge_id:GLOBAL.bookingid
                 })

  socket.on("join_broadcast", msg => {
  //this.setState({status:false})
  if (msg.status == true){
    setmessage(msg.data)

  }else{
  setmessage([])
  }

    });

    socket.emit('join_broadcast',{

                                    astrologer_id:GLOBAL.another,
                                    user_id:store.getState().user.id,
                                    bridge_id:GLOBAL.bookingid
                 })
checkwallets()

},[])

  useEffect(() => {

//     setTimeout(() => {
//       handleConnect33()
//
//   }, 24000);
//
//   setTimeout(() => {
//     handleConnect2()
//
// }, 12000);

  //handleConnect()
    //handleConnect()
  handleConnect2()

//  handleConnect2()

//  switchAudio()
//  switchAudio()


  },[adaptor])
  useEffect(() => {
    if (adaptor) {
      console.log('checking localstream here.');
      const verify = () => {
        if (
          adaptor.localStream.current &&
          adaptor.localStream.current.toURL()
        ) {
          return setLocalStream(adaptor.localStream.current.toURL());
        }
        setTimeout(verify, 3000);
      };
      verify();
    }
  }, [adaptor]);

  // const getRemoteStreams = () => {
  //     const remoteStreams = [];
  //     if (adaptor && Object.keys(adaptor.remoteStreams).length > 0) {
  //       for (let i in adaptor.remoteStreams) {
  //         if (i !== stream.id) {
  //           let st =
  //             adaptor.remoteStreams[i][0] &&
  //               'toURL' in adaptor.remoteStreams[i][0]
  //               ? adaptor.remoteStreams[i][0].toURL()
  //               : null;
  //           if (st) remoteStreams.push(st);
  //         }
  //       }
  //     }
  //     return remoteStreams;
  //   };
  const getRemoteStreams = () => {
    const remoteStreams = [];


    if (adaptor && Object.keys(adaptor.remoteStreams).length > 0) {


      for (let i in adaptor.remoteStreams) {


  if (i !== stream.id) {


    // if (join == false){
    //       if(adaptor.remoteStreams[`user${GLOBAL.user_id}`]){
    //     //    alert('hi')
    //      adaptor.leaveFromRoom(roomId)
    //
    //       }
    // }


    if(adaptor.remoteStreams[`${route.params.item.astrologer.id}`]){

      let st =
        adaptor.remoteStreams[`${route.params.item.astrologer.id}`][0] &&
          'toURL' in adaptor.remoteStreams[`${route.params.item.astrologer.id}`][0]
          ? adaptor.remoteStreams[`${route.params.item.astrologer.id}`][0].toURL()
          : null;


          if (remoteStreams.length == 0){
            if (st) remoteStreams.push(st);
          }



    }





}

      }
    }
    return remoteStreams;
  };

const  chat = (price,ef) =>{






var priceS = parseInt(price)

setgetamount(price)

    var wallet = parseInt(GLOBAL.wallet)



    var e = {
                            astrologer_id: GLOBAL.another,
                            price_per_mint:price,
                            type :"3",
                            token:store.getState().token,
                            user_id:store.getState().user.id
         }

         console.log('socket')

     console.log(JSON.stringify(e))
     GLOBAL.queue = joiner.length

    if (wallet >= priceS){
      if (joiner.length == 3){
        alert('Queue are full pleae wait.')
        return
      }

    //  alert(JSON.stringify(this.state.joiner))


      for (var i = 0 ; i <joiner.length ; i++){
        if (joiner[i].user_id == GLOBAL.user_id){

          return
        }
      }

      RBSheetstarted.current.open()


      // this.props.navigation.navigate('CreateKundliForms',{
      //   data:e,
      //   callback:this.dds
      // })
      // // socket.emit('astrologer_realtimebook',{
      // //                         astrologer_id: this.props.route.params.item.id,
      // //                         price_per_mint:price,
      // //                         type :"3",
      // //                         token:store.getState().token,
      // //                         user_id:store.getState().user.id
      // //      });
      // //      this.rese()
    }else{
     // alert('You have to keep 5 minute Wallet balance')
      //this.setState({modalOpen:true})

    }

  }

const  joincheck = (item) => {
    if (item.user_id == GLOBAL.user_id){
      setbookingid(item.id)

        rBSheetend.current.open()
    }


  }

  const renderStream = ({ item: _stream }) => {
    const count = allStreams.length;
    let wScale = 1;
    let hScale = 1;
    if (count > 3 && count < 6) wScale = 2;
    else if (count > 6) wScale = 3;

    if (count % 3 === 0 || count >= 5) hScale = 3;
    else if (count < 5 && count !== 1) hScale = 2;

    return (
      <View

        style={{ width: width / wScale, height: height / hScale }}>
        {<StreamView stream={_stream} />}
      </View>
    );
  };


const  start = () =>{
//  handleConnect3()
    RBSheetstarted.current.close()
    const socket = io('http://139.59.25.187:3355', {
      transports: ['websocket']
    })
    socket.on("book_broadcast", msg => {
  //alert(JSON.stringify(msg))
    if (msg.status == true){
  //RtcEngine.setClientRole(Host)
    }else{
   //RtcEngine.setClientRole(Audience)
    }

      });

      socket.emit('book_broadcast',{

                                      astrologer_id:GLOBAL.another,
                                      user_id:GLOBAL.user_id,
                                      bridge_id:GLOBAL.bookingid,
                                      total_minutes:"5",
                                      amount:GLOBAL.broadcastingprice
                   })
  }

const closeHandler = async () => {


  // handleVideo()
  // console.log('close video');
  // console.log({
  //   astrologer_id: store.getState().user.user_id,
  //
  //   bridge_id: route.params.item.bridge_id,
  // });
  // // const res = await EndBrodcastApi({
  // //   astrologer_id: this.props.route.params.user.user_id,
  //
  // //   bridge_id: GLOBAL.bookingid,
  // // });
  // // console.log(res);
  // // return;
  // const {status = false} = await EndLive({
  //   astrologer_id: store.getState().user.user_id,
  //   bridge_id: route.params.item.bridge_id,
  // });
  // if (status) {
  //       handleDisconnect()
  //  navigation.goBack();
  //   console.log('asdfd');
  //   socket.emit('end_broadcast', {
  //     bridge_id: route.params.item.bridge_id,
  //   });
  //   handleDisconnect()
  //     alert('Your Live broadcast is successfully completed')
  // } else {
  //   console.log('failed');
  // }

    }

    const end = () =>{
      setJoin(false)
          setTimeout(() => {
            rBSheetend.current.close()
          //  adaptor.leaveFromRoom(roomId)
            setJoin(false)

      }, 3000);


    //handleConnect2()


      const socket = io('http://139.59.25.187:3355', {
        transports: ['websocket']
      })
      socket.on("complete_booking_broadcast", msg => {
    //alert(JSON.stringify(msg))
      if (msg.status == true){
    //RtcEngine.setClientRole(Host)
      }else{
     //RtcEngine.setClientRole(Audience)
      }

        });

        socket.emit('complete_booking_broadcast',{
                                        user_id:GLOBAL.user_id,
                                        bridge_id:GLOBAL.bookingid,
                                        booking_id:bookingid,

                     })

    }

  const  _renderItem = ({item,index}) =>{

       return (
         <TouchableOpacity activeOpacity = {0.99} onPress= {()=>RBSheetUser.current.open()}>
     <View >


     <Image
                      style={{
                          width: 32,
                          height: 32,
                          marginLeft:-8,
                          borderWidth:1,
                          borderColor:'#ffc850',
                          marginTop:7,
                          borderRadius:16



                      }}
                      source={{uri:item.user.imageUrl}}
                  />



     </View>
     </TouchableOpacity>
    )
    }

  const renderMaximizedStream = () => {
    if (!maximizedStream) return null;
    return (
      <View style={styles.fullscreen}>
        <StreamView stream={maximizedStream} />
        <TouchableOpacity
          onPress={() => setMaximizedStream(null)}
          style={styles.closeBtn}>
          <Text style={styles.btnTxt}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const pujaopen = (item,index) =>{

    const socket = io('http://139.59.25.187:3355', {
      transports: ['websocket']
    })


    socket.on("send_gift", msg => {
    //this.setState({status:false})
    if (msg.status == true){
      Toast.showWithGravity('Thanks for Donation', Toast.LONG, Toast.CENTER);
      refRBSheet.current.close()
      //setmessage(msg.data)

    }else{
            Toast.showWithGravity(msg.message, Toast.LONG, Toast.CENTER);
    //setmessage([])
    }

      });

      socket.emit('send_gift',{

                                      gift_id:item.id,
                                      broadcast_id:route.params.item.id,
                                      user_id:store.getState().user.id,
                                      bridge_id:GLOBAL.bookingid
                   })


  }

  const remoteStreams = getRemoteStreams();
  let allStreams = [];
  if (localStream) allStreams = [localStream];

   if (remoteStreams.length) allStreams = [...remoteStreams];
   //alert(JSON.stringify(allStreams))

  const numColumns =
    allStreams.length <= 3
      ? 1
      : allStreams.length > 3 && allStreams.length <= 6
        ? 2
        : 3;

  return (
    <View style={styles.container}>
      <FlatList
        renderItem={renderStream}
        data={allStreams}
        keyExtractor={(item) => item}
        numColumns={numColumns}
        key={numColumns}
      />


{shown == true && (
  <View style= {{position:'absolute',top:200}}>
  <Animatable.View iterationCount={2} animation= {anim ? "slideInLeft":"slideInRight"}>
  <View style = {{width:300,flexDirection:'row',height:50}}>
  <View style = {{backgroundColor:'rgba(0,0,0,0.3)',width:240,borderRadius:22,height:46,flexDirection:'row'}}>
  <Image      source={{uri:mydata.gift_image}}
              style  = {{width:40, height:40,borderRadius:20,margin:10,marginTop:0,
            }}/>

  <Text style = {{color:'white',fontSize:12,marginTop:12,marginLeft:3,fontFamily:'Nunito-Bold'}}>
{mydata.user_name} Send Gift
          </Text>
<Image      source={{uri:mydata.user_image}}
            style  = {{width:40, height:40,borderRadius:20,margin:10,marginTop:0,
          }}/>

  </View>
  </View>

  </Animatable.View>
  </View>
)}

<View style = {{position:'absolute',top:120,left:10}}>

<View style = {{backgroundColor:'#7ED321',height:60,borderRadius:22,width:220,marginLeft:20,flexDirection:'row',justifyContent:'space-around',marginTop:12}}>
{joiner.length == 0 && (
  <TouchableOpacity onPress={() => chat(GLOBAL.broadcastingprice,0)}>
  <Image
      source={require('./add.png')}
      style={{width: 30, height: 30,margin:5,marginTop:10,resizeMode:'contain'}}


  />
  </TouchableOpacity>
)}
{joiner.length != 0 && (
<TouchableOpacity onPress={() => joincheck(joiner[0])}>
  <View>

  <Image
      source={{uri:joiner[0].user.imageUrl}}
      style={{width: 30, height: 30,margin:5,marginTop:10,resizeMode:'contain'}}


  />




  <Text numberOfLines={1} ellipsizeMode='tail'
   style = {{color:'white',fontFamily:"Nunito-Regular",fontSize:12,marginTop:-1,width:50}}>
  {joiner[0].user.name}
  </Text>

  </View>
  </TouchableOpacity>
)}
{joiner.length > 1 && (
  <TouchableOpacity onPress={() => joinchecks(joiner[1],"1")}>
  <View>
  <Image
      source={{uri:joiner[1].user.imageUrl}}
      style={{width: 30, height: 30,margin:5,marginTop:10,resizeMode:'contain'}}


  />
  <Text numberOfLines={1} ellipsizeMode='tail' style = {{color:'white',fontFamily:"Nunito-Regular",fontSize:12,marginTop:-1,width:50}}>
  {joiner[1].user.name}
  </Text>
  </View>
  </TouchableOpacity>
)}

{joiner.length < 2 && (
    <TouchableOpacity onPress={() => chat(GLOBAL.broadcastingprice,1)}>
<Image
    source={require('./add.png')}
    style={{width: 30, height: 30,margin:5,marginTop:10,resizeMode:'contain'}}


/>
</TouchableOpacity>
)}
{joiner.length > 2 && (
    <TouchableOpacity onPress={() => joinchecks(joiner[2],"2")}>
  <View>
  <Image
      source={{uri:joiner[2].user.imageUrl}}
      style={{width: 30, height: 30,margin:5,marginTop:10,resizeMode:'contain'}}


  />
  <Text numberOfLines={1} ellipsizeMode='tail' style = {{color:'white',fontFamily:"Nunito-Regular",fontSize:12,marginTop:-1,width:50}}>
  {joiner[2].user.name}
  </Text>
  </View>
  </TouchableOpacity>
)}

{joiner.length < 3 && (
    <TouchableOpacity onPress={() => chat(GLOBAL.broadcastingprice,2)}>
<Image
    source={require('./add.png')}
    style={{width: 30, height: 30,margin:5,marginTop:10,resizeMode:'contain'}}


/>
</TouchableOpacity>
)}
</View>

</View>


<View style = {{position:'absolute',top:220,alignSelf:'center'}}>
{ joiner.length  >= 1 && (
  <CountDown
         until={parseInt(joiner[0].remaining_time)}
          onFinish={() => console.log('hi')}
         digitStyle={{backgroundColor: '#FFF'}}
     digitTxtStyle={{color: '#1CC625'}}
     timeToShow={['M', 'S']}
     timeLabels={{m: 'MM', s: 'SS'}}
       />
)}

</View>




<RBSheet
ref={RBSheetUser}
closeOnDragDown={true}
height={window.height - 90}
openDuration={250}
customStyles={{
container: {
justifyContent: "center",
alignItems: "center"
}
}}
>
<User  greeting = {message}/>
</RBSheet>

<RBSheet
ref={RBSheetstarted}

closeOnDragDown={true}
height={window.height - 90}
openDuration={250}
customStyles={{
container: {
justifyContent: "center",
alignItems: "center"
}
}}
>
<Started  callback = {start}/>
</RBSheet>


<RBSheet
  ref={rBSheetend}

closeOnDragDown={true}
height={window.height - 90}
openDuration={250}
customStyles={{
container: {
justifyContent: "center",
alignItems: "center"
}
}}
>
<End  callback = {end}/>
</RBSheet>

      <RBSheet customStyles={{ container: { height: 400,backgroundColor:'#f5f5f5' }}}
        ref={refRBSheet}
        closeOnDragDown={true}
        closeOnPressMask={false}



      >
        <View style = {{backgroundColor:'black',height:400,width:window.width}} >
        <FlatList
                data={route.params.gift}

                 numColumns={4}
                renderItem={({item,index}) => (

                  <TouchableOpacity onPress={()=>pujaopen(item,index)} >
                  <View style = {{margin:5,borderBottomWidth:0,borderColor:'#f1f1f1',width:width/3.2,borderWidth:0,borderColor:'#f1f1f1',marginBottom:5}}>
             <Image  style = {{width:50,height:50,alignSelf:'center',resizeMode:'contain',marginTop:6}}
             source = {{uri:item.imageUrl}}/>

                    <Text style={{color:'white',fontFamily:'Avenir-Medium',height:30,textAlign:'center'}}>{item.name}</Text>
                    <View style = {{}}>
                                <Text style={{color:'white',fontFamily:'Avenir-Medium',textAlign:'center',marginTop:-10}}>Rs :{item.price}</Text>

        </View>

                  </View>
                  </TouchableOpacity>
                )}
              />


        </View>
      </RBSheet>
      <View style={styles.absView}>
          {/*      <Text>uid: {this.props.uid}, channelName: {this.props.channelName}, peers: {this.state.peerIds.join(",")}</Text>*/}


          <View style={{flex:2,flexDirection:'row',backgroundColor:'transparent',width:window.width - 30,position:'absolute',bottom:10,height:200}}>
    <View style = {{flexDirection:'row',width:window.width - 90}}>

    <Chat>

              </Chat>



              </View>
    <TouchableOpacity style = {{position:'absolute',height:30,bottom:12,right:-20,marginLeft:60,flexDirection:'row'}}onPress={()=>refRBSheet.current.open()}>
              <View >

              <Image
                           source={require('../assets/ic_Gift.png')}
                           style={{
                             width: 40,
                             height: 40,
                             margin: 5,
                             marginLeft:20,

                             resizeMode: 'contain',

                           }}
                         />



              </View>
              </TouchableOpacity>


          </View>


      </View>

      <View
              style={{
               
                width: '100%',
                top: StatusBar.currentHeight + 10,
                position: 'absolute',
    height:50
              }}>
    <View style = {{flexDirection:'row',justifyContent:'space-between'}}>

    <View style = {{flexDirection:'row',width:140,marginLeft:20,borderRadius:22}}>


    <View style = {{flexDirection:'row',margin:10,backgroundColor:'rgba(0,0,0,0.6)',width:150,borderRadius:22}}>
    <Image   source={{uri:GLOBAL.pimage}}
         style  = {{width:30, height:30,borderRadius:15,borderWidth:2,borderColor:'white',marginLeft:12,marginTop:8
       }}/>
       <View>

       <Text  numberOfLines={1} style={{fontFamily:"Nunito-Regular",fontSize:17,color:'white',marginTop:3, width: 100}}>
         {GLOBAL.priest_name}

       </Text>


       <View style = {{flexDirection:'row',height:30,marginLeft:8}}>
       <Image
           source={require('./fire.png')}
           style={{width: 14, height: 14,marginLeft:1,marginTop:8,resizeMode:'contain'}}


       />

       <Text style={{fontFamily:"Nunito-Bold",fontSize:16,marginTop:3,color:'white'}}>
         {message.length}

       </Text>
       </View>



    </View>


    </View>

    </View>
    <View style = {{flexDirection:'row',marginRight:12,width:170}}>

    <View style = {{width:110}}>
    <FlatList style
    data={message}
    renderItem={_renderItem}
    inverted = {true}
    horizontal
    style={{
        flex:1
    }}
    />
    </View>
    <TouchableOpacity
                  style={{
                    padding: 5,
                    // backgroundColor: 'red',
                    marginLeft: 'auto',
                  }}
                  activeOpacity={0.99}
                  onPress={() => toy()}>
    <Image
    source={require('./cross.png')}
    style={{width: 30, height: 30,resizeMode:'contain'}}


    />
    </TouchableOpacity>
    </View>


    </View>





    </View>

    </View>
  );
};

export default Antq;
