import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
//import profile from '../../assets/profile'

import * as ExpoImagePicker from 'expo-image-picker';

import axios from 'axios';
import { Image, View, Text } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';

interface ImagePickerProps {
    storagePath: string|null;
    title?: string;
    setData: any;
    data: any
    render?: boolean;
}

const ImagePicker = forwardRef(({storagePath=null,title,setData,data,render=true}:ImagePickerProps,ref) => {
    const [image, setImage] = useState<string>(data);
    const [status, setStatus] = useState<null|string>(null);
    
    useEffect(() => {
        if (!storagePath) return;

        const storage = getStorage();
        (async ()=>{await getDownloadURL(storageRef(storage, storagePath + ''))
            .then((url) => {
                setImage(url);
                console.log(image);
            }).catch(error => {
                console.log('err',image);
            }).finally(() => {
            })
        })()
    }, []);

    useEffect(() => {
        if (setData && image) {
            setData(image)
        }
    }, [image]);


    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ExpoImagePicker.launchImageLibraryAsync({
            mediaTypes: ExpoImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1
        });

        if (!result?.canceled) {
            setImage(result.assets[0].uri);
            console.log('loaded img',result);
        } else console.log('cancelled');
    };

    const uploadImage = async (databasePath:string,storagePath:string) => {
        let localUri = image;
        let filename = localUri.split('/').pop() || '';

        console.log(localUri,filename);

        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : 'image';

        let formData = new FormData();
        formData.append('photo', { uri: localUri, name: filename, type });

        const storage = getStorage();
        const ref = storageRef(storage, storagePath+'/'+filename);

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

        await uploadBytes(ref, blob).then(async (snapshot) => {
            console.log('Uploaded a blob or file!');
            console.log(snapshot);
            setStatus('loading');

            const storage = getStorage();
            await getDownloadURL(storageRef(storage, storagePath+'/'+filename))
                .then((url) => {
                    // TODO UPLOAD IMAGE URL
                    console.log(url);
                }).catch(error => {
                    console.log('err',image);
                }).finally(() => {
            })

        }).catch(error => console.error(error));

        return true;
    };

    const publicRef = {
        upload: uploadImage
    }
    useImperativeHandle(ref, () => publicRef);


    return (<View>
        <Button onPress={pickImage} disabled={status!=null} >{title||'Válassz képet'}</Button>
        {render &&<>
            <Text>Választott kép:</Text>{image ? <Image source={{uri:image}} style={{width:100,height:100}}/> : <Text>Nincs kép választva</Text>}
            {status==='loading'&& <ActivityIndicator /> }
            {status==='done'&& <Text>Sikeres feltöltés!</Text>}
        </>}
    </View>)
})
ImagePicker.displayName = 'ImagePicker'

export default ImagePicker
