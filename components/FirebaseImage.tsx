import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { Image, ImageStyle, StyleProp, StyleSheet, View } from "react-native"
import { ActivityIndicator } from "react-native-paper";

interface FirebaseImageProps {
    path: string;
    style?: StyleProp<ImageStyle>;
}


const FirebaseImage = ({path,style}:FirebaseImageProps) => {
    const [source, setSource] = useState('');
    const [loading, setLoading] = useState(true);

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

    return (<View>
        <Image source={{uri:source}} style={style} 
            onLoadEnd={()=>setLoading(false)} 
        />
        <ActivityIndicator style={styles.activityIndicator} animating={loading}/>
        </View>)
}
const styles = StyleSheet.create({
  activityIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }
})

export default FirebaseImage;