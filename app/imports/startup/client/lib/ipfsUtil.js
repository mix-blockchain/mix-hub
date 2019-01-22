global.Buffer = global.Buffer || require("buffer").Buffer;
const ipfsAPI = require('ipfs-api')
let multihashes = require('multihashes')


module.exports = {

    initIPFS: async (useSecondaryScript = false)=>{
        Session.set('ipfsConnected',false);

        if (LocalStore.get('browserIpfs') == null) {LocalStore.set('browserIpfs', true)}
        
        try{
            if(LocalStore.get('browserIpfs')) {
                let scriptURL = useSecondaryScript ? "https://unpkg.com/ipfs/dist/index.min.js" : "https://cdn.jsdelivr.net/npm/ipfs/dist/index.min.js";
                $.getScript(scriptURL, async ()=>{

                    try{
                    const repoPath = 'ipfs-mix'
                    
                    global.ipfs = new Ipfs({ repo: repoPath });

                    
                    global.ipfs.bootstrap.add('/ip6/2400:6180:0:d0::151:6001/tcp/4001/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu');
                    global.ipfs.bootstrap.add('/ip6/2604:a880:1:20::203:d001/tcp/4001/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM');
                    global.ipfs.bootstrap.add('/ip6/2604:a880:800:10::4a:5001/tcp/4001/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64');
                    global.ipfs.bootstrap.add('/ip6/2a03:b0c0:0:1010::23:1001/tcp/4001/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd');

                    console.log(await global.ipfs.bootstrap.list());
                    global.ipfs.on('ready', async () => { 
                        Session.set('ipfsConnected',false);
                        Session.set('ipfsId',null);
                        let files = await module.exports.getItemFromIpfsHash('Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a',false);
                        if(files && files.length > 0) {
                            $.notify({
                                icon: 'glyphicon glyphicon-success-sign',
                                title: '',
                                message: 'IPFS daemon successfully started in browser! ',
                                target: '_blank',
                                allow_dismiss: false,
                            },{
                                animate: {
                                    enter: 'animated fadeInDown',
                                    exit: 'animated fadeOutUp'
                                },
                                type:'success',
                                showProgressbar: false,
                                placement: {
                                    from: "bottom",
                                    align: "center"
                                }
                            });

                            Session.set('ipfsConnected',true);
                        }
                        let id = await ipfs.id();
            
                        Session.set('ipfsId', id.id);
        
                        
                    })
                    }catch(e) {
                        module.exports.initIPFS(false);
                    }
                
                });
                
            } else {
                global.ipfs = ipfsAPI(LocalStore.get('ipfsApiURL'), '5001', {protocol: LocalStore.get('protocol')});
                Session.set('ipfsConnected',false);
                Session.set('ipfsId',null);

                let files = await module.exports.getItemFromIpfsHash('Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a', false);
                if(files && files.length > 0) {
                    Session.set('ipfsConnected',true);
                }

                let id = await ipfs.id();
                Session.set('ipfsId', id.id);
          
        }
        } catch(e) {
            
            console.log(e);

        }
        
    },

    getItemFromHexHash: async(hash) => {
        let encodedIpfsHash = await multihashes.toB58String(multihashes.encode(Buffer.from(hash.substr(2), "hex"), 'sha2-256'));
        let returnArray = await module.exports.getItemFromIpfsHash(encodedIpfsHash, true);
        return returnArray;
        
    },

    getItemFromIpfsHash: async(hash, isTimer) => {

        const ipfs = global.ipfs;
        let promise = new Promise((resolve, reject) => {
            ipfs.get(hash).then(files =>{resolve(files)});
        
        })

        if(isTimer) {
            let ms = 13000;
        
            let timeout = new Promise((resolve, reject) => {
                let id = setTimeout(() => {
                clearTimeout(id);
                reject('Timed out in '+ ms + 'ms.')
                }, ms)
            })
            
            return Promise.race([promise,timeout]);
        
        } else {
            return promise;
        };
    },

    addFile: async(data, isInfuraPost = false) => {
        const ipfs = isInfuraPost ? ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'}) : global.ipfs;
        let result = await ipfs.add(data);
        let hash = result[0].hash;
        return hash;
    },

    addFileReturnData: async(data) => {
        const ipfs = global.ipfs;
        let result = await ipfs.add(data);
        //let res = await module.exports.addFile(data, true);
        return result[0];
    },

    addFiles: async(dataArray, isInfuraPost = false) => {
        let hashes = [];
        const ipfs = isInfuraPost ? ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'}) : global.ipfs;
        await dataArray.forEach(async data=>{
            try{

                let result = await ipfs.add(data);
                hashes.push(result[0].hash);

            }catch(e) {
                console.log(e)
            }

        })
        return hashes;
    },

    pinHash: async(hash, isInfuraPost = false) => {
        const ipfs = isInfuraPost ? ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'}) : global.ipfs;
        let result = await ipfs.pin.add(hash);
        return result;

    }


};
