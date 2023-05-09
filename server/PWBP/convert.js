function LCapped(x,y,z,hex) {
    const longCount=y*(z-1); const longLength=x-2;
    const longRE=RegExp(".{" + longLength + "}","g")
    const shortCount=y;const shortLength=x-4;
    const shortRE=RegExp(".{" + shortLength + "}","g")
    const prefixLength=x*y*z - longCount*longLength - shortCount*shortLength
    const i1=prefixLength; 
    const i2=i1+shortLength*shortCount;
    const i3=i2+longCount*longLength

    const binString=BigInt(hex).toString(2).padStart(x*y*z,"0")

    const prefixString=binString.substring(0,i1);
    const shortString=binString.substring(i1,i2);
    const longString=binString.substring(i2,i3)

    const lpa=prefixString.substring(0,2*y*z).match(/.{2}/g)
    const spa=prefixString.substring(2*y*z).match(/.{2}/g)
    const ssa=shortString.match(shortRE)
    const lsa=longString.match(longRE)

    var almostRows=[]
    for (let i in ssa) { 
        almostRows.push(spa[i][0]+ssa[i]+spa[i][1]) 
    }
    almostRows.push(...lsa)
    var rows=[]
    for (let j=0;j<z;j++) {
        for (let i=y-1;i>=0;i--) {
            rows.push(lpa[j*y+i][0]+almostRows[j*y+i]+lpa[j*y+i][1])
        }
    }
    return rows.join('').replaceAll('0','#').replaceAll('1','_')
}

function BottomCapped(x,y,z,hex) {
    const longCount=y*(z-1); const longLength=x;
    const longRE=RegExp(".{" + longLength + "}","g")
    const shortCount=y;const shortLength=x-2;
    const shortRE=RegExp(".{" + shortLength + "}","g")
    const prefixLength=x*y*z - longCount*longLength - shortCount*shortLength
    const i1=prefixLength; 
    const i2=i1+shortLength*shortCount;
    const i3=i2+longCount*longLength

    const binString=BigInt(hex).toString(2).padStart(x*y*z,"0")

    const prefixString=binString.substring(0,i1);
    const shortString=binString.substring(i1,i2);
    const longString=binString.substring(i2,i3)

    const lpa=null
    const spa=prefixString.substring(0,2*y*z).match(/.{2}/g)
    const ssa=shortString.match(shortRE)
    const lsa=longString.match(longRE)

    var almostRows=[]
    for (let i in ssa) { 
        almostRows.push(spa[i][0]+ssa[i]+spa[i][1]) 
    }
    almostRows.push(...lsa)
    var rows=[]
    for (let j=0;j<z;j++) {
        for (let i=y-1;i>=0;i--) {
            rows.push(almostRows[j*y+i])
        }
    }
    return rows.join('').replaceAll('0','#').replaceAll('1','_')
}

function ICapped(x,y,z,hex) {
    const longCount=y*z; const longLength=x-2;
    const longRE=RegExp(".{" + longLength + "}","g")
    const shortCount=0;const shortLength=x-4;
    const shortRE=RegExp(".{" + shortLength + "}","g")
    const prefixLength=x*y*z - longCount*longLength - shortCount*shortLength
    const i1=prefixLength; 
    const i2=i1+shortLength*shortCount;
    const i3=i2+longCount*longLength

    const binString=BigInt(hex).toString(2).padStart(x*y*z,"0")

    const prefixString=binString.substring(0,i1);
    const shortString=binString.substring(i1,i2);
    const longString=binString.substring(i2,i3)

    const lpa=prefixString.substring(0,2*y*z).match(/.{2}/g)
    const spa=prefixString.substring(2*y*z).match(/.{2}/g)
    const ssa=shortLength?shortString.match(shortRE):[]
    const lsa=longString.match(longRE)

    var almostRows=[]
    for (let i in ssa) { 
        almostRows.push(spa[i][0]+ssa[i]+spa[i][1]) 
    }
    almostRows.push(...lsa)
    var rows=[]
    for (let j=0;j<z;j++) {
        for (let i=y-1;i>=0;i--) {
            rows.push(lpa[j*y+i][0]+almostRows[j*y+i]+lpa[j*y+i][1])
        }
    }
    return rows.join('').replaceAll('0','#').replaceAll('1','_')
}

function Basic(x,y,z,hex) {
    const longCount=y*(z); const longLength=x;
    const longRE=RegExp(".{" + longLength + "}","g")

    const binString=BigInt(hex).toString(2).padStart(x*y*z,"0")

    const longString=binString
    const lsa=longString.match(longRE)

    var almostRows=[]
    almostRows.push(...lsa)
    var rows=[]
    for (let j=0;j<z;j++) {
        for (let i=y-1;i>=0;i--) {
            rows.push(almostRows[j*y+i])
        }
    }
    return rows.join('').replaceAll('1','#').replaceAll('0','_')
}

function Poly(x,y,z,hex) {
    let binString=BigInt(hex).toString(2).padStart(x*y*z,"0")
    let almostRows
    let bitlen = (x*1+7) - (x*1-1)%8
    if (binString.length > x*y*z) {
        binString=binString.padStart(bitlen*y*z,"0")
        if (x <=8 ) almostRows=binString.match(/.{8}/g).map(el => el.substring(0,x))
        else if (x<=16) almostRows=binString.match(/.{16}/g).map(el => el.substring(0,x))
        else if (x<=24) almostRows=binString.match(/.{24}/g).map(el => el.substring(0,x))
    } else {
        const longRE=RegExp(".{" + x + "}","g")
        almostRows=binString.match(longRE)
    }
    
    var rows=[]
    for (let j=0;j<z;j++) {
        for (let i=y-1;i>=0;i--) {
            rows.push(almostRows[j*y+i])
        }
    }
    return rows.join('').replaceAll('1','#').replaceAll('0','_')
}

function IdToVoxel(p) {
    // path[0] = type
    // path[1] = subtype
    // path[[2] = id
    let x=0; let y=0; let z=0
    let retval;
    switch (true) {
        case ( p[0] == "Burrs" &&  /\d*\.\d*\.\d*-/.test(p[2]) ): // Name is in 3.2.1-0D43 format
        case ( p[0] == "Polyominoes" ):
            tv=p[2].split('-')
            dims=tv[0].split('.')
            l=dims.length
            if (l<3) x=1 
            else x=dims[l-3]; 
            y=dims[l-2]; z=dims[l-1]
            h='0x' + tv[1]
            retval = Poly(x,y,z,h)
            break;
        case ( (p[0] == "Burrs") && /x/.test(p[1]) ): //Burr dimension contains a letter x
            x = p[1].split('x')[0]
            y = p[1].split('x')[1][0]
            z = p[1].split('x')[1][1]
            h='0x'+p[2]
            retval=ICapped(x,y,z,h)
            break;
        case ( (p[0] == "Burrs") && /^\d*$/.test(p[1]) ): //Burr dimension is just a number
            x = p[1]
            y = 2
            z = 2
            l=p[2].length
            h='0x'+p[2]
            switch (true) {
                case ( (x==6) && (l<6)):
                    retval=LCapped(x,y,z,p[2])
                    break
                case ( (x==4) ):
                    retval=LCapped(x,y,z,p[2])
                    break
                case ( (x==7) && (l==6)  ):
                    retval=ICapped(x,y,z,h)
                    break
                case ( (x==7) && (l==7)  ):
                    retval=BottomCapped(x,y,z,h)
                    break
                case ( false ):
                    retval=Basic(x,y,z,h)
                    break
                default:
                    retval=LCapped(x,y,z,h)
                    break
            }
            break;
        default:
            retval=""
            break;
    }
    return { x:x, y:y, z:z, stateString: retval }
}

module.exports = {
    convert: IdToVoxel
}