import React, { useEffect, useState } from 'react';
import { GestureResponderEvent, ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Menu, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import elapsedTime from '@/lib/functions/elapsedTime';
import { addComment, clearComments, editComment, deleteComment as deleteCommentSlice } from '@/lib/redux/reducers/commentsReducer';
import { RootState } from '@/lib/redux/store';
import { CommentsState, UserState } from '@/lib/redux/store.type';
import * as ExpoImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ref as dbRef, getDatabase, limitToLast, off, onChildAdded, onChildChanged, push, query, remove, set } from 'firebase/database';
import { deleteObject, getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import FirebaseImage from '../FirebaseImage';
import UrlText from './UrlText';
import { Comment, CommentsProps } from './comments.types';

const Comments = ({path,placeholder,limit=10}:CommentsProps) => {
    const dispatch = useDispatch();
    const navigation = router;

    const { uid, name }: UserState = useSelector(
        (state: RootState) => state.user
    );
    const { comments }: CommentsState = useSelector(
        (state: RootState) => state.comments2
    );
    const author = name;
    const [text, setText] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState<{x:number;y:number;comment:Comment}|null>(null);
    const db = getDatabase()

    useEffect(() => {
        dispatch(clearComments());

        const q = limit ? query(dbRef(db,path),limitToLast(limit)) : dbRef(db,path)
        
        onChildAdded(q, (data) => {
            console.log('ADDED');
            
            dispatch(addComment({
                ...data.val(),
                key: data.key
            }))
            setDownloading(false)
        });

        onChildChanged(q,(data)=>{
            dispatch(editComment({
                ...data.val(),
                key: data.key
            }))
        })
        

        setTimeout(() => {
            setDownloading(false)    
        }, 3000);
        return (()=>{
            off(q,'child_added')
        })
    }, [db, dispatch, limit, path]);

    const openMenu = () => setShowMenu(true);
    const closeMenu = () => setShowMenu(false);

    const pickImage = async () => {
        let result = await ExpoImagePicker.launchImageLibraryAsync({
            mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1
        }).catch(error=>{
            console.log(error);
            
        });

        

        if (result && !result?.canceled) {
            setImage(result.assets[0].uri);
        } else console.log('cancelled');
    };
    const handleSend = async () => {
        if (author && text && uid) {
            setLoading(true)
            const newPostRef = push(dbRef(db,path))
            set(newPostRef ,{
                author,
                text,
                date:Date.now(),
                uid
            })
            .then(async (res)=>{
                if (image && newPostRef.key) {
                    const upload = await uploadImage(uid+'/'+path,newPostRef.key)
                    console.log('image upload',upload);
                    
                    setImage('');
                    setLoading(false)
                } else {
                    setLoading(false)
                    setText('')
                }
            }).catch(err=>{
                console.log({
                    author,
                    text,
                    date:Date.now(),
                    uid
                },'upload to',path);
                
                console.log(err);
            })
        }
    }
    const uploadImage = async (storagePath:string,key:string) => {
        
        let localUri = image;
        let fileName = localUri.split('/').pop() || '';

        let match = /\.(\w+)$/.exec(fileName);
        let type = match ? `image/${match[1]}` : 'image';

        let formData = new FormData();
        const file = new File([localUri], fileName, {
            type
        });
        formData.append('image', file);

        const blob:Blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
              resolve(xhr.response);
            };
            xhr.onerror = function (e) {
              console.log(e);
            reject(new TypeError('Network request failed'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', localUri, true);
            xhr.send(null);
        });

        const storage = getStorage();
        const imageStorageRef = storageRef(storage, storagePath+'/'+key+'/'+fileName);

        const upload = await uploadBytes(imageStorageRef, blob)
        .then(async (snapshot) => {

            return await getDownloadURL(imageStorageRef)
                .then(async (imageUrl) => {
                    const imageUpdateRef = dbRef(db,path+'/'+key+'/fileName');
                    
                    return await set(imageUpdateRef,fileName).then(res2=>{
                        console.log('DB update with image success',key);
                        return fileName;
                    }).catch(error=>{
                        console.log('DB update with image error, on '+storagePath+'/'+key+'/fileName',error);
                        return error
                    })
                })
                .catch(error => {
                    console.log('err',image);
                    return error
                })
        })
        .catch(error => {return error});

        return upload;
    };
    const showCommentMenu = (event: GestureResponderEvent,comment: Comment) => {
        const { nativeEvent } = event;
        
        const anchor = {
            x: nativeEvent.pageX,
            y: nativeEvent.pageY,
            comment
        };

        setMenuAnchor(anchor);
        openMenu();
    }
    const deleteComment = (comment:Comment) => {
        const deleteRef = dbRef(db,path+'/'+comment.key);

        remove(deleteRef).then(res=>{
            console.log(res);
            setMenuAnchor(null);
            dispatch(deleteCommentSlice(comment.key))
            if (comment.fileName !== '')
                removeImage(comment);
            //TODO TOAST
        }).catch(err=>{
            console.log(err);
            setMenuAnchor(null);
            
        })
    }
    const removeImage = (comment:Comment) => {
        const storage = getStorage();
        
        const imageRef = storageRef(storage, comment.uid+'/'+path+'/'+comment.key+'/'+comment.fileName);
        deleteObject(imageRef).then(() => {
            console.log('image deleted');
            
        }).catch((error) => {
        // Uh-oh, an error occurred!
            console.log('image delete error',error);
            
        })
    }
    const dismissImage = () => {
        setImage('');
    }

    return (
        <View>
            <View style={{flexDirection:'row'}}>
                <View style={{flexGrow:1}}>
                    <TextInput style={{}} value={text} 
                    onChangeText={setText} 
                    onSubmitEditing={handleSend}
                    disabled={!uid}
                    placeholder={uid?((placeholder) ? placeholder : 'Kommented'):'Jelentkezz be a hozzászóláshoz.'}/>
                </View>
                {image ? 
                    <ImageBackground source={{uri:image}}>
                        <IconButton icon='close' onPress={dismissImage}/>
                    </ImageBackground>
                    :<IconButton icon='image' onPress={pickImage} 
                    disabled={!uid}/>
                }
                <Button icon="arrow-left-bottom-bold"
                onPress={handleSend} disabled={!uid || !text} style={{height:'100%',margin:0}}
                    loading={loading}
                >
                    <Text>Küldés</Text>
                </Button>
            </View>
            <View style={{flexDirection:'row',padding:10}}>
                <Text style={{flex:1}}>Kommentek:</Text>
                <Text>Újabbak elöl</Text>
            </View>
            {!!comments?.length &&<ScrollView style={{padding:5}} contentContainerStyle={{flexWrap:'wrap',flexDirection:'row'}}>
                {comments.map((comment,ind)=>{
                    return (
                        <View key={'comment'+ind} style={[{backgroundColor:'white',margin:5,maxWidth:'100%'}]} >
                            <View style={{flexDirection:'row',alignItems:'center'}}>
                                <View style={{flexDirection:'row',flex:1,paddingHorizontal:8}}>
                                    <Pressable onPress={()=>{
                                        if (comment?.uid)
                                            navigation.push({pathname:'profil',params:{uid:comment.uid}})
                                        }}>
                                        <Text style={{fontWeight:'bold'}}>{comment.author}</Text>
                                    </Pressable>
                                    <Text> {elapsedTime(comment.date)}</Text>
                                </View>
                                <IconButton icon='dots-vertical' onPress={(e)=>showCommentMenu(e,comment)} size={18} style={{margin:0}} />
                            </View>
                            <UrlText text={comment.text} />
                            {comment.fileName && <FirebaseImage path={comment.uid+'/'+path+'/'+comment.key+'/'+comment.fileName} style={{width:'100%',height:100}} />}
                        </View>
                    )
                })}
            </ScrollView>}

            {uid && menuAnchor && <Menu
                visible={showMenu}
                onDismiss={closeMenu}
                anchor={menuAnchor}
            >
                {menuAnchor.comment?.uid === uid ? <>
                    <Menu.Item onPress={()=>deleteComment(menuAnchor.comment)} title="Törlés" leadingIcon="delete" /></>
                : <>
                <Menu.Item onPress={() => {}} title="Feljelentem" leadingIcon="alert" disabled />
                <Menu.Item onPress={() => {}} title={menuAnchor.comment?.author + " profilja"} leadingIcon="account" disabled />
                </>}
            </Menu>}
            {downloading ? <ActivityIndicator /> :
            !comments?.length && <Text style={{padding:20}}>Még nem érkezett komment</Text>}
        </View>)
}

export default Comments;