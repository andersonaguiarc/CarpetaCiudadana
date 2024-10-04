import { initializeApp } from 'firebase/app';
import { Request, Response } from "express";
import * as admin from 'firebase-admin';
import { UserCredential, getAuth, signInWithEmailAndPassword, signOut, } from 'firebase/auth'

// TODO: import { firebaseConfig } from "../../config/firebase/firebaseConfig";
// TODO: import { serviceAccount } from '../../config/firebase/serviceAccount';
const serviceAccount = require("../../config/firebase/service-account.json");
const firebaseConfig = require("../../config/firebase/firebase-config.json");

import { ROLES } from "../domain/roles";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp)

export const Info = async (req: Request, res: Response) => {
    res.send({
        message: 'This is working!',
        path: req.path
    });
}

export const Register = async (req: Request, res: Response) => {
    console.log("Body to register", req.body)
    const { password, password_confirm, email, id } = req.body;
    if (password !== password_confirm) {
        console.error(`${new Date().toLocaleString()}: Passwords do not match`);
        return res.status(400).send({
            message: "Password's do not match!"
        })
    }

    const assignedRole = ROLES.citizen;
    console.log('assignedRole:', assignedRole)

    const newUserCredentials = {
        email: email,
        password: password
    }

    admin.auth().createUser(newUserCredentials)
        .then((userRecord) => {
            console.log(userRecord)
            return admin.auth().setCustomUserClaims(userRecord.uid, { role: assignedRole, id });
        })
        .then((resp) => {
            console.log(`${new Date().toLocaleString()}: User registration successful.`, resp);
            res.status(200).json({
                message: 'User registration successful.'
            });
        })
        .catch((error) => {
            console.error(`${new Date().toLocaleString()}: Error registering user.`, error);
            res.status(400).send({
                message: 'Error registering user.'
            });
        });
}

export const Login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log(`${new Date().toLocaleString()}: Login method called`);

    signInWithEmailAndPassword(auth, email, password)
        .then(async (credentials: UserCredential) => {
            const user = credentials.user;
            const email = user.email;
            const token = await user.getIdToken();
            console.log(`${new Date().toLocaleString()}: User login successful`);
            res.status(200).json({ email, token });
        })
        .catch((error) => {
            console.error(`${new Date().toLocaleString()}: Failed to login user`, error);
            res.status(401).json({
                error: 'Invalid credentials'
            });
        });
}

export const SignOut = async (res: Response) => {
    signOut(auth)
        .then(_ => {
            console.log(`${new Date().toLocaleString()}: User logout successful`);
            res.cookie('jwt', '', { maxAge: 0 });
            res.status(200).json({ message: 'Logout successful' });
        })
        .catch((error) => {
            console.error(`${new Date().toLocaleString()}: Failed to logout user`, error);
            res.status(500).json({
                error: 'Failed to logout user'
                , errorDetails: error
            });
        });
}

export const UpdatePassword = async (req: Request, res: Response) => {
    res.json({ message: 'Method not implemented yet!' });
}

export const DeleteUserByEmail = async (req: Request, res: Response) => {
    console.log('Delete user y email method called: ', req.params.email);
    const email = req.params?.email;

    try {

        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        await admin.auth().deleteUser(uid);

        res.status(201).send({
            message: `User with email ${email} has been deleted successfully.`,
        });
    } catch (error) {
        console.log('Error deleting user:', error);
        res.status(500).send({
            message: 'Error deleting user',
            error: error.message,
        });
    }
};
