"use client";

import { useDisclosure } from "@mantine/hooks";

import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useMemo,
    useState,
} from "react";

export type ShellContextProp = {
    navbarProps: {
        mobileOpened: boolean;
        toggleMobile: () => void;
        desktopOpened: boolean;
        toggleDesktop: () => void;
        adminUser: boolean;
        setAdminUser: Dispatch<SetStateAction<boolean>>;
    };
};

const ShellContext = createContext<ShellContextProp>({
    navbarProps: {
        mobileOpened: false,
        toggleMobile: () => {},
        desktopOpened: true,
        toggleDesktop: () => {},
        adminUser: false, // for use where auth context is not viable
        setAdminUser: () => {}, // for setting adminUser from where auth context is viable
    },
});

export function ShellContextProvider({ children }: { children: ReactNode }) {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

    const [adminUser, setAdminUser] = useState(false);

    const contextValue: ShellContextProp = useMemo(
        () => ({
            navbarProps: {
                mobileOpened: mobileOpened,
                toggleMobile: toggleMobile,
                desktopOpened: desktopOpened,
                toggleDesktop: toggleDesktop,
                adminUser: adminUser,
                setAdminUser: setAdminUser,
            },
        }),
        [
            mobileOpened,
            toggleMobile,
            desktopOpened,
            toggleDesktop,
            adminUser,
            setAdminUser,
        ]
    );

    return (
        <ShellContext.Provider value={contextValue}>
            {children}
        </ShellContext.Provider>
    );
}

export function useShellContext() {
    return useContext(ShellContext);
}
