
function elapsedTime(date:string) {
    if (!date) return null;

    let str = 'másodperce'
    let elapsed = Date.now()-Number(date)
    
    if (isNaN(elapsed)) return null;
    elapsed /= 1000
    if (elapsed >= 60) {
        elapsed /= 60
        str = 'perce'
        if (elapsed >= 60) {
            elapsed /= 60
            str = 'órája'
            if (elapsed >= 24) {
                elapsed /= 24
                str = 'napja'
                if (elapsed >= 7) {
                    elapsed /= 7
                    str = 'hete'
                    if (elapsed >= 4) {
                        elapsed /= 4
                        str = 'hónapja'
                        if (elapsed >= 12) {
                            elapsed /= 12
                            str = 'éve kb.'
                        }
                    }
                }
            }
        }
    }
  
    return Math.floor(elapsed) +' '+ str
}

  export default elapsedTime;