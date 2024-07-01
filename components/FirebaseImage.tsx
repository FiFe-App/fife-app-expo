import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { Image, ImageStyle, StyleProp } from "react-native"

interface FirebaseImageProps {
    path: string;
    style?: StyleProp<ImageStyle>;
}


const FirebaseImage = ({path,style}:FirebaseImageProps) => {
    const [source, setSource] = useState('');

    useEffect(() => {
        const storage = getStorage();
        const imageRef = ref(storage,path);
        getDownloadURL(imageRef).then(res=>{
            setSource(res);
            console.log(res);
            
        }).catch(err=>{
            console.log(err);
            
        })
    }, [path]);

    return (<Image source={{uri:source}} style={style} />)
}

export default FirebaseImage;