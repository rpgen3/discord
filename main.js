(async () => {
    const {importAll, getScript, importAllSettled} = await import(`https://rpgen3.github.io/mylib/export/import.mjs`);
    await getScript('https://code.jquery.com/jquery-3.3.1.min.js');
    const $ = window.$;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const head = $('<dl>').appendTo(html),
          body = $('<dl>').appendTo(html),
          foot = $('<dl>').appendTo(html);
    const rpgen3 = await importAll([
        'input'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const addBtn = (h, ttl, func) => $('<button>').appendTo(h).text(ttl).on('click', func);
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    $('<div>').appendTo(head).text('discordの絵文字でプリントする');
    $('<div>').appendTo(head).text('処理する画像の設定');
    const makeLoadFunc = ctor => url => new Promise((resolve, reject) => Object.assign(new ctor, {
        onload: ({target}) => resolve(target),
        onloadedmetadata: ({target}) => resolve(target),
        onerror: reject,
        crossOrigin: 'anonymous',
        src: url
    }));
    const image = new class {
        constructor(){
            this.config = $('<div>').appendTo(head);
            this.html = $('<div>').appendTo(head);
            this._load = makeLoadFunc(Image);
            this.img = null;
        }
        async load(url){
            this.html.empty().append(this.img = await this._load(url));
        }
    };
    { // 画像入力
        const selectImg = rpgen3.addSelect(image.config, {
            label: 'サンプル画像',
            save: true,
            list: {
                'レナ': 'Lenna.png',
                'アニメ風レナ': 'Lena_all.png',
                'マンドリル': 'Mandrill.png'
            }
        });
        selectImg.elm.on('change', () => {
            image.load(`https://rpgen3.github.io/spatialFilter/img/${selectImg()}`);
        }).trigger('change');
        const inputURL = rpgen3.addInputStr(image.config, {
            label: '外部URL'
        });
        inputURL.elm.on('change', () => {
            const urls = rpgen3.findURL(inputURL());
            if(urls.length) image.load(urls[0]);
        });
        $('<input>').appendTo(image.config).prop({
            type: 'file'
        }).on('change', ({target}) => {
            const {files} = target;
            if(files.length) image.load(URL.createObjectURL(files[0]));
        });
    }
    const inputType = rpgen3.addSelect(body, {
        label: '色比較アルゴリズム',
        save: true,
        list: {
            'RGB表色系でのユークリッド距離による色差の計算' : 3,
            'XYZ表色系でのユークリッド距離による色差の計算' : 2,
            'L*a*b*表色系でのユークリッド距離による色差の計算' : 1,
            'CIEDE2000による色差の計算' : 0
        },
        value: 'CIEDE2000による色差の計算'
    });
    const inputWidth = rpgen3.addInputNum(body, {
        label: '幅',
        save: true,
        min: 16,
        max: 64,
        value: 16
    });
    const msg = new class {
        constructor(){
            this.html = $('<div>').appendTo(foot);
        }
        async print(str){
            this.html.text(str);
            await sleep(0);
        }
    };
    addBtn(body, '出力', () => start()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    const rpgen4 = await importAll([
        'getEmoji'
    ].map(v=>`./mjs/${v}.mjs`));
    const start = async () => {
        const type = inputType(),
              {img} = image,
              {width, height} = img,
              w = inputWidth(),
              h = w * (height / width) | 0,
              cv = $('<canvas>').prop({
                  width: w,
                  height: h
              }),
              ctx = cv.get(0).getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const {data} = ctx.getImageData(0, 0, w, h),
              max = data.length >> 2;
        let cnt = 0, result = '';
        for(const i of Array(max).keys()) {
            if(!(++cnt % 100)) await msg.print(`${i}/${max}`);
            const _i = i << 2;
            result += `:${rpgen4.getEmoji(...data.subarray(_i, _i + 4), type)}:`;
            if(!((i + 1) % width)) result += '\n';
        }
        await msg.print(`文字数：${result.length}`);
        rpgen3.addInputStr(foot.empty(),{
            value: result,
            copy: true
        });
    };
})();
