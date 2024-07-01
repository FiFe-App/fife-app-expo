import { useEffect } from "react";
import { useState } from "react";
import { Linking, Pressable, Text } from "react-native";

const UrlText = ({text=""}:{text:string}) => {
    const regex = /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?/g
    const arr = text.match(regex);
    
    const [result, setResult ] = useState<any[]|null>(null);
    const makeText = () => {
        let list:any[] = [];
        let pre = 0;

        if (arr?.length)
        arr.map((link,ind)=>{
            const start = text.indexOf(link)
            const end = start+link?.length;
            list.push(<Text key={ind+'s'}>{text.slice(pre,start)}</Text>)
            list.push(
                <Text key={ind+'k'}><Pressable onPress={()=>{Linking.openURL(text.slice(start,end))}}>
                <Text style={{color:'blue'}}>{text.slice(start,end)}</Text>
            </Pressable></Text>)
            pre+=end;
        })
        list.push(<Text key={'e'}>{text.slice(pre,text.length)}</Text>)
        setResult(list);
    
    }
    useEffect(() => {
        makeText();
    }, [text]);
    
    return (<Text >{result}</Text>)  
}

export default UrlText