import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Definition des donnees et proprietes
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,

    },
    tokens: [
        {
            token: {
                type: String,
                required: true

            }
        }
    ]

});

// intercepte le processus de sauvegarde du document utilisateur puis hache le mp du user  avant qu'il ne soit stocke dans la db  

userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);

    }
    next();
});

// generation du token JWT
userSchema.methods.generateToken = async function() {
    let user = this;
    const token = jwt.sign({_id: user._id.toString() }, process.env.JWT_SECRET, {expiresIn: '72h'});
    user.tokens = user.tokens.concat({ token});  //ajouter le jeton a liste des tokens du user
    await user.save();
    return token;
};
// methode de modele personnaliser pour rechercher l'utilisateur par son token pour l'authentification

userSchema.statics.findByToken = async function(token) {
    let User = this;
    let decoded;

    try {
        if (!token) {
            return new Error('Token manquant');
        }
        decoded = jwt.verify(token, process.env.JWT_SECRET) // permet de verifier l'authenticite d'un jeton JWT et d'extraire les informations qu'il contient pour prendre des decisions(atravers la verfication de la validite et la signature du token JWT et si le jeton est valide retourne une charge utile qui contient des informations )

    } catch (error) {
        return error;

    }
    return await User.findOne({
        _id: decoded._id,
        'tokens.token' : token
    });
};

// creer une methode mongoose pour l'authentification
userSchema.statics.findByCredentials = async (username, password) => {
    const user = await User.findOne({ username });
    if (!user) {
        throw new Error('Unable to login. Wrong username!');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Unable to login. Wrong Password!');
    }
    return user;
};

const User = mongoose.model('user', userSchema);
export default User;