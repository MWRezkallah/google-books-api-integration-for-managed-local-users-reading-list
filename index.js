// https://console.cloud.google.com/apis
// const apiVolumeInfo = 'https://www.googleapis.com/books/v1/volumes/s1gVAAAAYAAJ'
// const apiKey = 'AIzaSyChS3hHiBkKpw2Ab3nPyHsBVEjuuCFyhyo';
// AIzaSyBz9DxM05X8lkXHZEWplmMAK3kQcQ9mHrA

import ReadLine from "readline";
import qs from "querystring"
import axios from "axios";
import fs from 'fs'
import { promisify } from 'util'

const apiURL = 'https://www.googleapis.com/books/v1/volumes';
const rl = ReadLine.createInterface(process.stdin, process.stdout);
const question = promisify(rl.question).bind(rl);
const http = axios.create({baseURL:apiURL});
const read = promisify(fs.readFile);
const write = promisify(fs.writeFile);
const file = "./ReadingList.json";

const main =  async () => {
    do{
        const option = await question(`please choose an option:\n
        1)Read user's reading list.
        2)Add book to user's reading list.
        or quit to exit...\n `)
        
        if (new RegExp(/^q(?:uit)?$/i).test(option)) return "Thanks, See you next time bye!\n"; //===> q | quit
        if(! new RegExp(/^[1-2]$/).test(option)) continue; // ===> 1 | 2
        const username = await question(`enter your username:\n`) // ==> enter your username:
        if(username.length == 0 ) continue;
        if(!fs.existsSync(file)) await write(file, JSON.stringify([{"username":username}]))
        switch(option){
            case "1":
                await displayUserReadingList(username);
                break;
            case "2":
                await addBookToReadingList(username);
                break;
            default:
                continue;
        }
    }while(true)

    

}

//option number 2 all the following 3 function 
async function searchByQuery(query){
    const {data:{items:books, totalItems:count}} = await http.get("?" + query )
    const bookList = books.map( item => {
        return {"authors": item.volumeInfo.authors,
                "title": item.volumeInfo.title,
                "publisher": item.volumeInfo.publisher,
                "link": item.volumeInfo.previewLink}});
    return bookList;    
}

async function selectBook(books){
    const bookList = books.reduce((previous,book, index) =>
                        `${previous}${index+1}) ${book.title}\n`,
                         "`\n choose a number of the book u want to add to the reading list or quit to exit...\n");
    let bookNum = await question(bookList)
    const quitExp = new RegExp(/q[uit]?/i)
    while(true){
        if(quitExp.test(bookNum)) return false;
        if(!isNaN(bookNum) && bookNum<= books.length){
             console.log("you have choosed   " , JSON.stringify(books[+bookNum-1], null, 3))
             return books[bookNum-1]
        }else{
            bookNum = await question(bookList)
        }
    }
}

async function addBookToReadingList(username){
    do{
        const query = await question(`Please, Enter your search keywords:\n
            intitle: Returns results where the text following this keyword is found in the title.
            inauthor: Returns results where the text following this keyword is found in the author.
            inpublisher: Returns results where the text following this keyword is found in the publisher.
            subject: Returns results where the text following this keyword is listed in the category list of the volume.
            isbn: Returns results where the text following this keyword is the ISBN number.
            lccn: Returns results where the text following this keyword is the Library of Congress Control Number.
            oclc: Returns results where the text following this keyword is the Online Computer Library Center number.
            \n
            --------example---------
            Pride and Prejudice inauthor: Jane Austen\n`
        );
        if(query.length == 0)  continue
        const parsedQS = qs.stringify({"q":query}) // ==> to apend apikey 
        const books =  await searchByQuery(parsedQS)
        const book = await selectBook(books);
        if(!book) continue
        const data =  JSON.parse(await read(file))
        const index = data.findIndex(user=> user.username === username)
        if(index <0 ) {
            data.push({username,"readingList":[book]});
        }else{
            data[index].readingList ? data[index].readingList.push(book): data[index].readingList = [book];
        } 
        await write(file, JSON.stringify(data));
        break;
    }while(true)
}

// option 1
async function displayUserReadingList(username){
    const data =  JSON.parse(await read(file))
    const index = data.findIndex(user=> user.username === username)
    if (index<0 || !data[index].readingList ) {
        console.log(`${username} doesn't have a reading list yet!\n`);
         return;
    }
    console.log(JSON.stringify(data[index], null, 3))
}

// you use these to run your app
main().then((message)=>{
    console.log(message);
    rl.close();
})


