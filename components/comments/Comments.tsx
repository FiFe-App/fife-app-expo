import { RootState } from '@/lib/redux/store';
import { UserState } from '@/lib/redux/store.type';
import { router } from 'expo-router';
import { getDatabase, limitToLast, off, onChildAdded, push, query, ref, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ActivityIndicator, Button, TextInput } from 'react-native-paper';
import { useSelector } from 'react-redux';
import UrlText from './UrlText';

interface CommentsProps {
    path: string;
    placeholder: string;
    limit: number;
}

const Comments = ({path,placeholder,limit}:CommentsProps) => {
    const [list, setList] = useState<Array<any>>([]);
    const navigation = router;
    const [width, setWidth] = useState(0);
    
    const { uid, name }: UserState = useSelector(
        (state: RootState) => state.user
    );
    const [author, setAuthor] = useState(name);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(true);
    const db = getDatabase()

    const handleSend = async () => {
        if (author && text) {
            setLoading(true)
            const newPostRef = push(ref(db,path))
            set(newPostRef ,{
                author,text,uid
            })
            .then(res=>{
                setLoading(false)
                setText('')
            }).catch(err=>{
                console.log(err);
            })
        }
    }

    useEffect(() => {
        setList([])

        const q = limit ? query(ref(db,path),limitToLast(limit)) : ref(db,path)
        
        onChildAdded(q, (data) => {
            setList(old => [data.val(),...old])
            setDownloading(false)
        });
        setTimeout(() => {
            setDownloading(false)    
        }, 3000);
        return (()=>{
            off(ref(db,path),'child_added')
        })
    }, [db, limit, path]);

    return (
        <View style={[{}]} onLayout={(e)=>setWidth(e.nativeEvent.layout.width)}>
                <View style={{flexDirection:'row'}}>
                    <View style={{flexGrow:1}}>
                        {!name && <TextInput style={{}} value={author} onChangeText={setAuthor} placeholder="Név"/>}
                        <TextInput style={{}} value={text} 
                        onChangeText={setText} 
                        placeholder={(placeholder) ? placeholder : 'Kommented'}/>
                    </View>
                    <Button icon="arrow-left-bottom-bold"
                    onPress={handleSend} disabled={!author || !text} style={{height:'100%',margin:0}}
                        loading={loading}
                    >
                        <Text>Küldés</Text>
                    </Button>
                </View>
                <Text style={{marginLeft:10,marginTop:10}}>Kommentek:</Text>
                {!!list?.length &&<ScrollView style={{padding:5}} contentContainerStyle={{flexWrap:'wrap',flexDirection:'row'}}>
                    {list.map((comment,ind)=>{

                        return (
                            <View key={'comment'+ind} style={[{backgroundColor:'white',padding:5,margin:5,maxWidth:'100%'}]}>
                                <Pressable onPress={()=>{
                                    if (comment?.uid)
                                        navigation.push({pathname:'profil',params:{uid:comment.uid}})
                                    }}>
                                    <Text>{comment.author}</Text>
                                </Pressable>
                                <UrlText text={comment.text} />
                            </View>
                        )
                    })}
                </ScrollView>}
                {downloading ? <ActivityIndicator /> :
                !list?.length && <Text style={{padding:20}}>Még nem érkezett komment</Text>}
        </View>)
}

export default Comments;